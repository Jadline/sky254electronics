"use server";

import { after } from "next/server";
import { absoluteUrl } from "@/config/site";
import { ENQUIRY_LIMITS, ENQUIRY_TOPICS, isEnquiryTopic } from "@/lib/enquiries";
import { sendEnquiryAlert } from "@/lib/notify";
import { normalisePhone } from "@/lib/order-labels";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnquiryResult = { ok: boolean; message: string; field?: string };

/** At most this many messages from one phone or email per hour, to stop floods. */
const MAX_PER_HOUR = 3;

/** Saves a message from the contact form and emails the shop about it. */
export async function sendEnquiry(_: EnquiryResult | null, form: FormData): Promise<EnquiryResult> {
  const value = (key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);
  // Bots that fill the hidden field are told it worked, and nothing is saved.
  if (value("website", 200)) return { ok: true, message: "Thanks! We'll get back to you soon." };

  const name = value("name", ENQUIRY_LIMITS.name);
  const rawPhone = value("phone", 20);
  const email = value("email", ENQUIRY_LIMITS.email).toLowerCase();
  const topic = value("topic", 20);
  const message = String(form.get("message") ?? "").trim();

  if (!name) return { ok: false, message: "Please enter your name.", field: "name" };
  const phone = rawPhone ? normalisePhone(rawPhone) : null;
  if (rawPhone && !phone) return { ok: false, message: "Please enter a valid Kenyan phone number, like 0712 345 678.", field: "phone" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "That email address doesn't look right.", field: "email" };
  if (!phone && !email) return { ok: false, message: "Please give a phone number or an email address so we can reply.", field: "phone" };
  if (!message) return { ok: false, message: "Please write your message.", field: "message" };
  if (message.length > ENQUIRY_LIMITS.message) return { ok: false, message: "Please keep your message under 3,000 characters.", field: "message" };

  const db = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = (column: "phone" | "email", sender: string | null) =>
    sender
      ? db.from("enquiries").select("id", { count: "exact", head: true }).eq(column, sender).gte("created_at", since)
      : Promise.resolve({ count: 0 });
  const [byPhone, byEmail] = await Promise.all([recent("phone", phone), recent("email", email || null)]);
  if ((byPhone.count ?? 0) >= MAX_PER_HOUR || (byEmail.count ?? 0) >= MAX_PER_HOUR) {
    return { ok: false, message: "We've already got your messages. We'll reply soon, or call or WhatsApp us if it's urgent." };
  }

  const enquiry = { name, phone, email: email || null, topic: isEnquiryTopic(topic) ? topic : "general", message };
  const { error } = await db.from("enquiries").insert(enquiry);
  if (error) return { ok: false, message: "We couldn't send your message just now. Please try again, or call or WhatsApp us." };

  after(() =>
    sendEnquiryAlert({ ...enquiry, topic: ENQUIRY_TOPICS[enquiry.topic], adminUrl: absoluteUrl("/admin/enquiries") }),
  );
  return { ok: true, message: `Thanks, ${name.split(" ")[0]}! We've got your message and will get back to you soon.` };
}
