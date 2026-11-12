/** What the owner edits under Shop settings. Empty text is left out of the site. */
export type ShopSettings = {
  email: string | null;
  address: string | null;
  hours: string | null;
  social: { facebook: string | null; instagram: string | null; tiktok: string | null };
  /** Orders at or above this amount deliver free (set under Delivery). null = no free delivery. */
  freeDeliveryOver: number | null;
};

export const EMPTY_SETTINGS: ShopSettings = {
  email: null,
  address: null,
  hours: null,
  social: { facebook: null, instagram: null, tiktok: null },
  freeDeliveryOver: null,
};

export type SettingsRow = {
  email: string | null;
  address: string | null;
  hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  free_delivery_over_kes: number | null;
};

export const SETTINGS_COLUMNS = "email, address, hours, facebook_url, instagram_url, tiktok_url, free_delivery_over_kes";

export function settingsFromRow(row: SettingsRow | null): ShopSettings {
  if (!row) return EMPTY_SETTINGS;
  const t = (value: string | null) => value?.trim() || null;
  return {
    email: t(row.email),
    address: t(row.address),
    hours: t(row.hours),
    social: { facebook: t(row.facebook_url), instagram: t(row.instagram_url), tiktok: t(row.tiktok_url) },
    freeDeliveryOver: row.free_delivery_over_kes,
  };
}
