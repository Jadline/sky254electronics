"use client";

import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useState, type InputHTMLAttributes } from "react";
import { FIELD } from "@/components/admin/ui";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

// Edge draws its own reveal and clear buttons inside password fields, which would sit on top of ours.
const NO_NATIVE_BUTTONS = "[&::-ms-clear]:hidden [&::-ms-reveal]:hidden";

/** An email field with an envelope icon. */
export function EmailInput(props: InputProps) {
  return (
    <div className="relative">
      <EnvelopeIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-adm-faint" />
      <input type="email" autoComplete="username" {...props} className={`${FIELD} py-3 pl-11 font-normal`} />
    </div>
  );
}

/** A password field with a lock icon and an eye button that shows or hides what was typed. */
export function PasswordInput(props: InputProps) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <LockClosedIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-adm-faint" />
      <input
        type={shown ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        className={`${FIELD} ${NO_NATIVE_BUTTONS} py-3 pr-12 pl-11 font-normal`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        title={shown ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-adm-faint transition-colors hover:bg-adm-surface hover:text-adm-ink focus-visible:ring-2 focus-visible:ring-adm-primary/30 focus-visible:outline-none"
      >
        {shown ? <EyeSlashIcon aria-hidden className="size-5" /> : <EyeIcon aria-hidden className="size-5" />}
      </button>
    </div>
  );
}
