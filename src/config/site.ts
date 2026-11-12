// Fixed shop details used around the site. Email, address, hours, social links and
// delivery fees are edited in the dashboard under Shop settings (lib/catalog.ts: getShopSettings).
export const site = {
  name: "Sky254 Electronics",
  phone: "+254 116 236902",
  /** Digits only with country code, e.g. "254700000000". Null hides WhatsApp links. */
  whatsapp: "254116236902" as string | null,
};

/** The shop's place for maps, from the address under Shop settings (or just Nairobi when it's empty). */
export const shopPlace = (address: string | null) => (address ? `${address}, Nairobi, Kenya` : "Nairobi, Kenya");

/** A Google Maps embed of that place, needing no API key. */
export const mapEmbedUrl = (address: string | null) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(shopPlace(address))}&z=${address ? 17 : 12}&output=embed`;

/**
 * The site's public address with no trailing slash, from SITE_URL (the same value
 * M-Pesa uses). Canonical links, the sitemap, structured data and the product feed
 * are built from it, so set it to the live https address before launch.
 */
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** An absolute link to a path on this site, e.g. absoluteUrl("/shop"). */
export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`);

export function whatsappLink(message: string) {
  return site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
    : null;
}
