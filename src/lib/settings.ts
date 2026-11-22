/** What the owner edits under Shop settings. Empty text is left out of the site. */
export type ShopSettings = {
  email: string | null;
  address: string | null;
  hours: string | null;
  /** Shown as typed, e.g. "+254 116 236902". null = the number built into the site. */
  phone: string | null;
  /** Digits only with the country code. null = use the phone number. */
  whatsapp: string | null;
  /** Where customers pay by M-Pesa. Any of the three can be set. */
  mpesaTill: string | null;
  mpesaPaybill: string | null;
  mpesaPaybillAccount: string | null;
  mpesaPhone: string | null;
  social: { facebook: string | null; instagram: string | null; tiktok: string | null };
  /** Orders at or above this amount deliver free (set under Delivery). null = no free delivery. */
  freeDeliveryOver: number | null;
};

export const EMPTY_SETTINGS: ShopSettings = {
  email: null,
  address: null,
  hours: null,
  phone: null,
  whatsapp: null,
  mpesaTill: null,
  mpesaPaybill: null,
  mpesaPaybillAccount: null,
  mpesaPhone: null,
  social: { facebook: null, instagram: null, tiktok: null },
  freeDeliveryOver: null,
};

export type SettingsRow = {
  email: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  whatsapp: string | null;
  mpesa_till: string | null;
  mpesa_paybill: string | null;
  mpesa_paybill_account: string | null;
  mpesa_phone: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  free_delivery_over_kes: number | null;
};

export const SETTINGS_COLUMNS = "email, address, hours, phone, whatsapp, mpesa_till, mpesa_paybill, mpesa_paybill_account, mpesa_phone, facebook_url, instagram_url, tiktok_url, free_delivery_over_kes";

export function settingsFromRow(row: SettingsRow | null): ShopSettings {
  if (!row) return EMPTY_SETTINGS;
  const t = (value: string | null) => value?.trim() || null;
  return {
    email: t(row.email),
    address: t(row.address),
    hours: t(row.hours),
    phone: t(row.phone),
    whatsapp: t(row.whatsapp),
    mpesaTill: t(row.mpesa_till),
    mpesaPaybill: t(row.mpesa_paybill),
    mpesaPaybillAccount: t(row.mpesa_paybill_account),
    mpesaPhone: t(row.mpesa_phone),
    social: { facebook: t(row.facebook_url), instagram: t(row.instagram_url), tiktok: t(row.tiktok_url) },
    freeDeliveryOver: row.free_delivery_over_kes,
  };
}
