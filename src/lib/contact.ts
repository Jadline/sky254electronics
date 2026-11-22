import { site } from "@/config/site";
import { normalisePhone } from "@/lib/order-labels";
import type { ShopSettings } from "@/lib/settings";

/** How customers reach the shop: what to show, what to dial, and where WhatsApp goes. */
export type ShopContact = {
  /** As written, for showing on the page. */
  phone: string;
  /** For tel: links: digits and a leading +. */
  tel: string;
  /** Digits with the country code, or null to hide WhatsApp links. */
  whatsapp: string | null;
};

/**
 * The shop's contact details from Shop settings in the dashboard. Anything left empty there falls
 * back to the number built into the site (config/site.ts), so nothing breaks before it is set.
 */
export function shopContact(settings: Pick<ShopSettings, "phone" | "whatsapp"> | null | undefined): ShopContact {
  const phone = settings?.phone || site.phone;
  const whatsapp = settings?.whatsapp || (settings?.phone ? normalisePhone(settings.phone) : site.whatsapp);
  return { phone, tel: phone.replace(/[^\d+]/g, ""), whatsapp };
}

/** A WhatsApp chat link with the message filled in, or null when the shop has no WhatsApp number. */
export function whatsappUrl(whatsapp: string | null, message: string) {
  return whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : null;
}
