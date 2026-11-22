"use client";

import { CheckIcon, EnvelopeOpenIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { requestPasswordReset, type FormState } from "@/app/admin/actions";
import { EmailInput } from "@/components/admin/auth-fields";
import { buttonClass, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

/** How long to wait before the link can be sent again. */
const RESEND_SECONDS = 60;

export function ForgotPasswordForm({ expired = false }: { expired?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const [email, setEmail] = useState("");
  // When the last link was requested, and a clock that ticks once a second after that.
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);
  // Lets "Use a different email" go back to the form without losing the success state in React.
  const [editing, setEditing] = useState(false);

  const markSent = () => {
    const t = Date.now();
    setSentAt(t);
    setNow(t);
    setEditing(false);
  };
  const keepValues = useKeepValues(action);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    markSent();
    keepValues(event);
  };
  const resend = () => {
    markSent();
    const form = new FormData();
    form.set("email", email);
    startTransition(() => action(form));
  };

  const remaining = sentAt ? Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000)) : 0;
  useEffect(() => {
    if (!sentAt || remaining === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sentAt, remaining]);

  // On success the action hands back the email it was given.
  // While a different address is being sent, keep showing the form rather than the old confirmation.
  const showSent = state.message && !editing && !(pending && state.message !== email.trim().toLowerCase());
  if (showSent) {
    return (
      <div role="status" className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-adm-tint px-5 py-6 text-center">
          <span className="relative grid size-14 place-items-center rounded-full bg-white text-adm-primary shadow-[0_8px_24px_rgba(6,105,214,0.18)]">
            <EnvelopeOpenIcon aria-hidden className="size-7" />
            <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-[#12b76a] text-white ring-2 ring-adm-tint">
              <CheckIcon aria-hidden className="size-3.5 stroke-[3]" />
            </span>
          </span>
          <div className="text-sm leading-relaxed text-adm-body">
            <p className="text-base font-semibold text-adm-ink">Check your email</p>
            <p className="mt-1">
              If <span className="font-medium break-all text-adm-ink">{state.message}</span> is an admin account, a reset link is on its way.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-2.5 text-sm text-adm-body">
          {["Open the email from Sky254.", "Tap the link, in this same browser.", "Choose a new password. The link works once, for one hour."].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-adm-surface text-xs font-bold text-adm-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={resend} disabled={pending || remaining > 0} className={`${buttonClass.outline} min-h-12`}>
            {pending ? "Sending…" : remaining > 0 ? `Send again in ${remaining}s` : "Didn't get it? Send again"}
          </button>
          <p className="text-center text-[13px] text-adm-muted">Nothing after a few minutes? Check your spam folder.</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => setEditing(true)} className="cursor-pointer font-medium text-adm-primary hover:text-adm-primary-dark hover:underline">
            Use a different email
          </button>
          <Link href="/admin/login" className="font-medium text-adm-primary hover:text-adm-primary-dark hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
      {expired && (
        <p role="alert" className="flex gap-2.5 rounded-xl border border-[#fedf89] bg-[#fffaeb] px-3.5 py-3 text-sm text-[#93370d]">
          <ExclamationTriangleIcon aria-hidden className="mt-px size-[18px] shrink-0" />
          That reset link has expired or was already used. Ask for a new one below.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-email" className="text-sm font-semibold">
          Email
        </label>
        <EmailInput
          id="reset-email"
          name="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <FormMessage state={editing ? {} : state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} min-h-12 text-[15px]`}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-adm-muted">
        Remembered it?{" "}
        <Link href="/admin/login" className="font-medium text-adm-primary hover:text-adm-primary-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
