"use client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useActionState, useState } from "react";
import { resetPassword, type FormState } from "@/app/admin/actions";
import { PasswordInput } from "@/components/admin/auth-fields";
import { MIN_PASSWORD_LENGTH, PasswordStrength } from "@/components/admin/password-strength";
import { buttonClass, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const onSubmit = useKeepValues(action);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const matches = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && !matches;

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-semibold">
            New password
          </label>
          <PasswordInput
            id="new-password"
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <PasswordStrength password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-semibold">
          Repeat new password
        </label>
        <PasswordInput
          id="confirm-password"
          name="confirm"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          aria-invalid={mismatch}
          aria-describedby="confirm-hint"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <p id="confirm-hint" aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-[13px]">
          {matches && (
            <>
              <CheckCircleIcon aria-hidden className="size-4 text-[#12b76a]" />
              <span className="text-[#116632]">Passwords match</span>
            </>
          )}
          {mismatch && (
            <>
              <XCircleIcon aria-hidden className="size-4 text-[#d92d20]" />
              <span className="text-[#b42318]">Passwords don&apos;t match yet</span>
            </>
          )}
        </p>
      </div>

      <FormMessage state={state} />
      <button type="submit" disabled={pending || !longEnough || !matches} className={`${buttonClass.primary} min-h-12 text-[15px]`}>
        {pending ? "Saving…" : "Save and sign in"}
      </button>
    </form>
  );
}
