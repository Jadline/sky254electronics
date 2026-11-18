import { NextResponse, type NextRequest } from "next/server";
import { syncPayment } from "@/lib/pesapal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Where Pesapal sends the customer after paying (with OrderTrackingId) or cancelling (with
 * our ?ref=). Checks the payment with Pesapal, then shows the customer their order page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const trackingId = params.get("OrderTrackingId") ?? "";
  const reference = params.get("OrderMerchantReference") ?? params.get("ref") ?? "";
  const fallback = NextResponse.redirect(new URL("/track-order", request.url), 303);

  const db = createAdminClient();
  const query = db.from("pesapal_payments").select("order_tracking_id, orders(access_token)");
  const { data: payment } = /^[0-9a-f-]{36}$/i.test(trackingId)
    ? await query.eq("order_tracking_id", trackingId).maybeSingle()
    : /^SKY-[A-Z0-9]{6}-[A-Za-z0-9_-]{8}$/.test(reference)
      ? await query.eq("merchant_reference", reference).maybeSingle()
      : { data: null };
  const order = payment?.orders as unknown as { access_token: string } | null;
  if (!payment || !order) return fallback;

  if (payment.order_tracking_id) {
    try {
      await syncPayment(payment.order_tracking_id);
    } catch (error) {
      // The IPN will still deliver the result, and the order page updates when it does.
      console.error(error);
    }
  }
  const response = NextResponse.redirect(new URL(`/order/${order.access_token}`, request.url), 303);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
