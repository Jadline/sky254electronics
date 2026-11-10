"use server";

import { checkCoupon, type CouponCheck } from "@/lib/coupon-check";
import { normalisePhone } from "@/lib/order-labels";

/**
 * Checks a coupon code for the checkout summary. Placing the order checks it again
 * against the real prices, so this only decides what the customer sees.
 */
export async function previewCoupon(code: string, subtotal: number, phone: string): Promise<CouponCheck> {
  if (typeof code !== "string" || !Number.isInteger(subtotal) || subtotal <= 0) return { ok: false, error: "That code isn't valid." };
  return checkCoupon(code, subtotal, typeof phone === "string" ? normalisePhone(phone) : null);
}
