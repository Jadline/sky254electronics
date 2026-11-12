"use client";

import { EnvelopeOpenIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/app/admin/actions";
import { EmailInput } from "@/components/admin/auth-fields";
import { buttonClass, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export function ForgotPasswordForm({ expired = false }: { expired?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const onSubmit = useKeepValues(action);

  // On success the action hands back the email it was given.
  if (state.message) {
    return (
      <div role="status" className="flex flex-col gap-5">
        <div className="flex gap-3.5 rounded-2xl bg-adm-tint p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-adm-primary">
            <EnvelopeOpenIcon aria-hidden className="size-5" />
          </span>
          <div className="text-sm leading-relaxed text-adm-body">
            <p className="font-semibold text-adm-ink">Check your email</p>
            <p className="mt-0.5">
              If <span className="font-medium break-all text-adm-ink">{state.message}</span> is an admin account, a reset link is on its way.
            </p>
          </div>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-adm-muted">
          <li>Open the link in this same browser.</li>
          <li>It works once, for one hour.</li>
          <li>Nothing after a few minutes? Check your spam folder.</li>
        </ul>
        <Link href="/admin/login" className={`${buttonClass.outline} min-h-12`}>
          Back to sign in
        </Link>
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
        <EmailInput id="reset-email" name="email" required autoFocus placeholder="you@example.com" />
      </div>
      <FormMessage state={state} />
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
