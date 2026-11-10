import type { DeliveryMethod } from "@/lib/order-labels";

/** What the owner edits under Shop settings. Empty text is left out of the site. */
export type ShopSettings = {
  email: string | null;
  address: string | null;
  hours: string | null;
  social: { facebook: string | null; instagram: string | null; tiktok: string | null };
  delivery: DeliveryRates;
};

/** Delivery fees in shillings. null = "we'll confirm the fee when we call". */
export type DeliveryRates = {
  nairobi: number | null;
  countrywide: number | null;
  /** Orders at or above this subtotal deliver free. null = no free delivery. */
  freeOver: number | null;
};

export const EMPTY_SETTINGS: ShopSettings = {
  email: null,
  address: null,
  hours: null,
  social: { facebook: null, instagram: null, tiktok: null },
  delivery: { nairobi: null, countrywide: null, freeOver: null },
};

/** The delivery fee for an order, or null when the shop confirms it by phone. Pickup is free. */
export function deliveryFee(method: DeliveryMethod, subtotal: number, rates: DeliveryRates): number | null {
  if (method === "pickup") return 0;
  const fee = rates[method];
  if (fee == null) return null;
  if (rates.freeOver != null && subtotal >= rates.freeOver) return 0;
  return fee;
}

export type SettingsRow = {
  email: string | null;
  address: string | null;
  hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  nairobi_fee_kes: number | null;
  countrywide_fee_kes: number | null;
  free_delivery_over_kes: number | null;
};

export function settingsFromRow(row: SettingsRow | null): ShopSettings {
  if (!row) return EMPTY_SETTINGS;
  const t = (value: string | null) => value?.trim() || null;
  return {
    email: t(row.email),
    address: t(row.address),
    hours: t(row.hours),
    social: { facebook: t(row.facebook_url), instagram: t(row.instagram_url), tiktok: t(row.tiktok_url) },
    delivery: { nairobi: row.nairobi_fee_kes, countrywide: row.countrywide_fee_kes, freeOver: row.free_delivery_over_kes },
  };
}
