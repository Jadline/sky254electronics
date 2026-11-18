"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { payOnlineBlocker } from "@/lib/order-labels";
import { pesapalReady, submitPayment, syncPayment } from "@/lib/pesapal";
import { createAdminClient } from "@/lib/supabase/admin";
import { site } from "@/config/site";

export type PayState = { error?: string };

const MAX_ATTEMPTS_PER_HOUR = 8;
// A payment page the customer opened recently is reused, so going back and pressing Pay
// again doesn't leave two payments open at Pesapal that could both be paid.
const REUSE_MINUTES = 30;
const FAILED = "We couldn't open the payment page. Please try again in a moment, or call us.";

/** Sends the customer to Pesapal to pay their order's total. */
export async function payOrder(_: PayState, form: FormData): Promise<PayState> {
  const token = String(form.get("token") ?? "");
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return { error: FAILED };
  if (!pesapalReady()) return { error: "Online payment isn't available right now. Please call us to pay." };

  const db = createAdminClient();
  const loadOrder = () =>
    db
      .from("orders")
      .select("id, order_number, status, payment_status, total_kes, delivery_method, delivery_fee_kes, customer_name, customer_phone, customer_email")
      .eq("access_token", token)
      .maybeSingle();
  let { data: order } = await loadOrder();
  if (!order) return { error: FAILED };
  const blocker = payOnlineBlocker(order);
  if (blocker) return { error: blocker };

  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: recent, error: recentError } = await db
    .from("pesapal_payments")
    .select("order_tracking_id, redirect_url, amount_kes, status, created_at")
    .eq("order_id", order.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (recentError) return { error: FAILED };

  // An earlier attempt may have gone through without the customer seeing it: check first.
  const open = recent.filter((p) => p.status === "pending" && p.order_tracking_id);
  if (open.length) {
    await Promise.allSettled(open.slice(0, 3).map((p) => syncPayment(p.order_tracking_id!)));
    ({ data: order } = await loadOrder());
    if (!order) return { error: FAILED };
    if (order.payment_status === "paid") return { error: "Your payment has come through. This order is paid." };
  }

  const reusable = open.find(
    (p) => p.redirect_url && p.amount_kes === order.total_kes && Date.now() - Date.parse(p.created_at) < REUSE_MINUTES * 60_000,
  );
  if (reusable) redirect(reusable.redirect_url!);

  if (recent.length >= MAX_ATTEMPTS_PER_HOUR) {
    return { error: "That's a lot of payment attempts. Please wait a while, or call us to pay." };
  }

  // Random text makes the reference unguessable: it leads back to this order's page.
  const reference = `${order.order_number}-${randomBytes(6).toString("base64url")}`;
  const { data: payment, error: insertError } = await db
    .from("pesapal_payments")
    .insert({ order_id: order.id, merchant_reference: reference, amount_kes: order.total_kes })
    .select("id")
    .single();
  if (insertError) return { error: FAILED };

  let redirectUrl: string;
  try {
    const created = await submitPayment({
      reference,
      amountKes: order.total_kes,
      description: `${site.name} order ${order.order_number}`,
      customerName: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
    });
    redirectUrl = created.redirectUrl;
    await db.from("pesapal_payments").update({ order_tracking_id: created.trackingId, redirect_url: created.redirectUrl }).eq("id", payment.id);
  } catch (error) {
    console.error(error);
    await db.from("pesapal_payments").delete().eq("id", payment.id);
    return { error: FAILED };
  }
  redirect(redirectUrl);
}
