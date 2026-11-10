"use client";

import { useState, useTransition } from "react";
import { subscribe, type SimpleResult } from "@/app/(site)/actions";

/** The footer's email sign-up for offers and new arrivals. */
export function NewsletterForm() {
  const [result, setResult] = useState<SimpleResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form
        className="mt-1.5 flex h-10 overflow-hidden rounded-full bg-white"
        onSubmit={(event) => {
          event.preventDefault();
          const formEl = event.currentTarget;
          const form = new FormData(formEl);
          startTransition(async () => {
            const outcome = await subscribe(String(form.get("email") ?? ""), String(form.get("website") ?? ""));
            setResult(outcome);
            if (outcome.ok) formEl.reset();
          });
        }}
      >
        <input
          name="email"
          type="email"
          required
          aria-label="Email address"
          placeholder="Your email address"
          className="min-w-0 flex-1 px-6 text-[13px] text-text outline-none"
        />
        {/* Hidden from people. Only bots fill this in. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-accent px-6 text-[13px] font-medium text-text uppercase transition-[filter] hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </form>
      <p role="status" className={`min-h-5 text-xs ${result && !result.ok ? "text-[#fca5a5]" : "text-on-ink"}`}>
        {result?.message}
      </p>
    </>
  );
}
