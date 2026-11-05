// Shop details shown around the site. Replace the [bracketed] placeholders.
export const site = {
  name: "Sky254 Electronics",
  phone: "[0700 000 000]",
  /** Digits only with country code, e.g. "254700000000". Null hides WhatsApp links. */
  whatsapp: null as string | null,
  email: "[hello@sky254.co.ke]",
  address: "[Shop address]",
  hours: "Open Mon–Sat, [8am – 7pm]",
  /** Add a full URL to show that social link. */
  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    tiktok: null as string | null,
  },
};

export function whatsappLink(message: string) {
  return site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
    : null;
}
