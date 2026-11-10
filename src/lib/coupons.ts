/** Coupon rules, shared by checkout and the dashboard. The server always re-checks a code. */

export type CouponKind = "percent" | "amount";

export type Coupon = {
  code: string;
  kind: CouponKind;
  value: number;
  min_subtotal_kes: number | null;
  max_discount_kes: number | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  once_per_customer: boolean;
  is_active: boolean;
};

/** Codes are stored in capitals without spaces, so "save 10" and "SAVE10" are the same. */
export const normaliseCode = (raw: string) => raw.toUpperCase().replace(/\s+/g, "").slice(0, 30);
export const isValidCode = (code: string) => /^[A-Z0-9-]{3,30}$/.test(code);

/** "10% off" or "KSh 500 off". */
export function couponLabel(coupon: Pick<Coupon, "kind" | "value" | "max_discount_kes">) {
  if (coupon.kind === "percent") {
    return `${coupon.value}% off${coupon.max_discount_kes ? ` (up to KSh ${coupon.max_discount_kes.toLocaleString("en-KE")})` : ""}`;
  }
  return `KSh ${coupon.value.toLocaleString("en-KE")} off`;
}

/**
 * The shillings a coupon takes off this subtotal, never more than the subtotal itself.
 * It applies to the prices shown, including products already on offer.
 */
export function discountFor(coupon: Pick<Coupon, "kind" | "value" | "max_discount_kes">, subtotal: number) {
  const raw = coupon.kind === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const capped = coupon.max_discount_kes != null ? Math.min(raw, coupon.max_discount_kes) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

/** Why a coupon can't be used right now, or null if it can (apart from use limits, checked in the database). */
export function couponProblem(coupon: Coupon, subtotal: number, now = new Date()): string | null {
  if (!coupon.is_active) return "That code isn't valid.";
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return "That code isn't valid yet.";
  if (coupon.ends_at && new Date(coupon.ends_at) <= now) return "That code has expired.";
  if (coupon.min_subtotal_kes != null && subtotal < coupon.min_subtotal_kes) {
    return `That code needs an order of KSh ${coupon.min_subtotal_kes.toLocaleString("en-KE")} or more.`;
  }
  return null;
}
