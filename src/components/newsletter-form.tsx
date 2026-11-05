"use client";

import { useState } from "react";

// Sign-ups aren't stored yet, so this says so instead of pretending to subscribe.
export function NewsletterForm() {
  const [notice, setNotice] = useState(false);

  return (
    <>
      <form
        className="mt-1.5 flex h-10 overflow-hidden rounded-full bg-white"
        onSubmit={(event) => {
          event.preventDefault();
          setNotice(true);
        }}
      >
        <input
          type="email"
          required
          aria-label="Email address"
          placeholder="Your email address"
          className="min-w-0 flex-1 px-6 text-[13px] text-text outline-none"
        />
        <button type="submit" className="cursor-pointer rounded-full bg-accent px-6 text-[13px] font-medium text-text uppercase transition-[filter] hover:brightness-105">
          Subscribe
        </button>
      </form>
      <p role="status" className="min-h-5 text-xs text-on-ink">
        {notice && "Email sign-up is coming soon."}
      </p>
    </>
  );
}
