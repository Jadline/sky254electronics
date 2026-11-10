import "server-only";
import { couponLabel, couponProblem, discountFor, isValidCode, normaliseCode, type Coupon } from "@/lib/coupons";
import { createAdminClient } from "@/lib/supabase/admin";

export type CouponCheck = { ok: true; code: string; label: string; discountKes: number } | { ok: false; error: string };

/**
 * Checks a code against a subtotal: that it exists, is switched on, is within its dates
 * and minimum, and has uses left (overall, and for this phone when it's once per customer).
 * Uses are counted from orders that weren't cancelled.
 */
export async function checkCoupon(rawCode: string, subtotal: number, phone: string | null): Promise<CouponCheck> {
  const code = normaliseCode(rawCode);
  const invalid = { ok: false as const, error: "That code isn't valid." };
  if (!isValidCode(code)) return invalid;

  const db = createAdminClient();
  const { data: coupon, error } = await db
    .from("coupons")
    .select("code, kind, value, min_subtotal_kes, max_discount_kes, starts_at, ends_at, max_uses, once_per_customer, is_active")
    .eq("code", code)
    .maybeSingle<Coupon>();
  if (error || !coupon) return invalid;

  const problem = couponProblem(coupon, subtotal);
  if (problem) return { ok: false, error: problem };

  const used = (forPhone?: string) => {
    let query = db.from("orders").select("id", { count: "exact", head: true }).eq("coupon_code", code).neq("status", "cancelled");
    if (forPhone) query = query.eq("customer_phone", forPhone);
    return query;
  };
  if (coupon.max_uses != null) {
    const { count } = await used();
    if ((count ?? 0) >= coupon.max_uses) return { ok: false, error: "That code has been used up." };
  }
  if (coupon.once_per_customer && phone) {
    const { count } = await used(phone);
    if ((count ?? 0) > 0) return { ok: false, error: "You've already used that code." };
  }

  const discountKes = discountFor(coupon, subtotal);
  if (discountKes <= 0) return invalid;
  return { ok: true, code, label: couponLabel(coupon), discountKes };
}
