"use client";

import { createContext, useContext } from "react";
import { whatsappUrl, type ShopContact } from "@/lib/contact";

const ContactContext = createContext<ShopContact | null>(null);

/** Hands the shop's phone and WhatsApp number (from Shop settings) to the client components below. */
export function ShopContactProvider({ contact, children }: { contact: ShopContact; children: React.ReactNode }) {
  return <ContactContext.Provider value={contact}>{children}</ContactContext.Provider>;
}

/** A function that builds a WhatsApp link for a message, or returns null if the shop has no WhatsApp number. */
export function useWhatsappLink() {
  const contact = useContext(ContactContext);
  return (message: string) => whatsappUrl(contact ? contact.whatsapp : null, message);
}
