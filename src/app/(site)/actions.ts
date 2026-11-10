"use server";

import { redirect } from "next/navigation";
import { normalisePhone } from "@/lib/order-labels";
import { createAdminClient } from "@/lib/supabase/admin";

export type SimpleResult = { ok: boolean; message: string };

/** Saves a newsletter sign-up. Signing up twice is fine and says the same thing. */
export async function subscribe(rawEmail: string, website: string): Promise<SimpleResult> {
  // Bots that fill the hidden field are told it worked, and nothing is saved.
  if (website) return { ok: true, message: "Thanks! You're on the list." };
  const email = String(rawEmail ?? "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Please enter a valid email address." };

  const { error } = await createAdminClient().from("newsletter_subscribers").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { ok: false, message: "We couldn't sign you up just now. Please try again." };
  return { ok: true, message: "Thanks! You're on the list for offers and new arrivals." };
}

/**
 * Finds an order by its number and the phone it was placed with, then opens its private
 * page. Both must match, so knowing an order number alone isn't enough.
 */
export async function trackOrder(_: SimpleResult | null, form: FormData): Promise<SimpleResult> {
  const number = String(form.get("order") ?? "")
    .trim()
    .toUpperCase()
    .replace(/^(SKY)?-?/, "SKY-");
  const phone = normalisePhone(String(form.get("phone") ?? ""));
  const notFound = { ok: false, message: "We couldn't find an order with that number and phone. Please check both and try again." };
  if (!/^SKY-[A-Z0-9]{6}$/.test(number) || !phone) return notFound;

  const { data } = await createAdminClient()
    .from("orders")
    .select("access_token")
    .eq("order_number", number)
    .eq("customer_phone", phone)
    .maybeSingle();
  if (!data) return notFound;
  redirect(`/order/${data.access_token}`);
}
