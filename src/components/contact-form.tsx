"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryResult } from "@/app/(site)/enquiry-actions";
import { ENQUIRY_LIMITS, ENQUIRY_TOPICS } from "@/lib/enquiries";

const FIELD = "h-11 w-full border border-line bg-white px-3.5 text-sm text-text outline-none focus:border-brand aria-invalid:border-[#b42318]";

/** The message form on the Contact page. */
export function ContactForm() {
  const [result, action, pending] = useActionState<EnquiryResult | null, FormData>(sendEnquiry, null);
  const invalid = (field: string) => (result && !result.ok && result.field === field ? true : undefined);

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col gap-2 self-start bg-tint p-6">
        <p className="text-lg font-medium">Message sent</p>
        <p className="text-sm text-body">{result.message}</p>
      </div>
    );
  }

  return (
    <form action={action} aria-labelledby="contact-form-h" className="flex flex-col gap-4">
      <div>
        <h2 id="contact-form-h" className="text-xl font-medium">Send us a message</h2>
        <p className="mt-1 text-sm text-muted">Give a phone number or an email address, and we&apos;ll reply there.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Your name
          <input name="name" required maxLength={ENQUIRY_LIMITS.name} autoComplete="name" aria-invalid={invalid("name")} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          What it&apos;s about
          <select name="topic" defaultValue="general" className={FIELD}>
            {Object.entries(ENQUIRY_TOPICS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Phone number
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" aria-invalid={invalid("phone")} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Email address
          <input name="email" type="email" maxLength={ENQUIRY_LIMITS.email} autoComplete="email" aria-invalid={invalid("email")} className={FIELD} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Message
        <textarea
          name="message"
          required
          rows={6}
          maxLength={ENQUIRY_LIMITS.message}
          placeholder="If it's about an order, include your order number."
          aria-invalid={invalid("message")}
          className={`${FIELD} h-auto py-3`}
        />
      </label>
      {/* Hidden from people. Only bots fill this in. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
      {result && !result.ok && <p role="alert" className="text-sm text-[#b42318]">{result.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-lift mt-1 h-12 w-full cursor-pointer bg-brand px-8 tracking-wide text-[13px] font-medium text-white uppercase disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
