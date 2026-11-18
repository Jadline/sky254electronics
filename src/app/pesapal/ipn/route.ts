import type { NextRequest } from "next/server";
import { syncPayment } from "@/lib/pesapal";

/**
 * Pesapal's notification (IPN) that a payment changed. It carries no result, so anyone
 * could call it: the payment's status is always fetched from Pesapal itself.
 * Registered as GET; POST is handled too in case it's registered that way by hand.
 */
async function handle(fields: { OrderTrackingId?: unknown; OrderMerchantReference?: unknown; OrderNotificationType?: unknown }) {
  const trackingId = typeof fields.OrderTrackingId === "string" ? fields.OrderTrackingId : "";
  let ok = false;
  if (/^[0-9a-f-]{36}$/i.test(trackingId)) {
    try {
      await syncPayment(trackingId);
      ok = true;
    } catch (error) {
      console.error(error);
    }
  }
  // Pesapal expects this reply, with 500 asking it to try again later.
  return Response.json({
    orderNotificationType: typeof fields.OrderNotificationType === "string" ? fields.OrderNotificationType : "IPNCHANGE",
    orderTrackingId: trackingId,
    orderMerchantReference: typeof fields.OrderMerchantReference === "string" ? fields.OrderMerchantReference : "",
    status: ok ? 200 : 500,
  });
}

export async function GET(request: NextRequest) {
  return handle(Object.fromEntries(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handle(body && typeof body === "object" ? body : {});
}
