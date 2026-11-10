/** Discounts, shared by the shop, checkout and the dashboard so all three agree on the price. */

export type DiscountType = "percent" | "amount";

export const DISCOUNT_TYPES: Record<DiscountType, string> = { percent: "%", amount: "KSh" };

/**
 * The price after a discount, or null when there's no usable discount: no price, no
 * discount, or one that would leave nothing to pay (e.g. KSh 3,000 off a KSh 2,500 item).
 */
export function salePrice(price: number | null, type: string | null, value: number | null): number | null {
  if (price == null || value == null || value <= 0) return null;
  let sale: number;
  if (type === "percent") {
    if (value >= 100) return null;
    sale = Math.round((price * (100 - value)) / 100);
  } else if (type === "amount") {
    sale = price - value;
  } else {
    return null;
  }
  return sale > 0 && sale < price ? sale : null;
}

/** "20% off" or "KSh 500 off", for labels. */
export function discountLabel(type: string | null, value: number | null) {
  if (value == null) return "";
  return type === "percent" ? `${value}% off` : `KSh ${value.toLocaleString("en-KE")} off`;
}

/** The colour for a price in the shop: grey with no price, red on sale, blue otherwise. */
export function priceTone(product: { priceKes: number | null; wasPriceKes: number | null }) {
  if (product.priceKes == null) return "text-muted";
  return product.wasPriceKes != null ? "text-sale" : "text-brand";
}
