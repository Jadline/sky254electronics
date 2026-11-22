"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimState = { error?: string; done?: boolean };

/**
 * The customer types the M-Pesa code from their payment message. It doesn't mark the order paid:
 * the shop checks it against its own M-Pesa statement first and marks it paid from the dashboard.
 */
export async function claimPayment(_: ClaimState, form: FormData): Promise<ClaimState> {
  const token = String(form.get("token") ?? "");
  const code = String(form.get("code") ?? "").toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return { error: "We couldn't find your order. Please call us." };
  if (!/^[A-Z0-9]{8,12}$/.test(code)) return { error: "That code doesn't look right. It's 8 to 12 letters and numbers, like SKL4X9Q2AB." };

  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("id, payment_status, status").eq("access_token", token).maybeSingle();
  if (!order || order.status === "cancelled") return { error: "We couldn't find your order. Please call us." };
  if (order.payment_status === "paid") return { done: true };

  const { error } = await db.from("orders").update({ payment_claim_code: code, payment_claimed_at: new Date().toISOString() }).eq("id", order.id);
  if (error) return { error: "We couldn't save that. Please try again, or call us." };
  return { done: true };
}
