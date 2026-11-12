"use client";

import { useActionState } from "react";
import { resetPassword, type FormState } from "@/app/admin/actions";
import { PasswordInput } from "@/components/admin/auth-fields";
import { buttonClass, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const onSubmit = useKeepValues(action);
  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-sm font-semibold">
          New password
        </label>
        <PasswordInput id="new-password" name="password" required minLength={10} autoComplete="new-password" autoFocus />
        <p className="text-[13px] text-adm-muted">At least 10 characters.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-semibold">
          Repeat new password
        </label>
        <PasswordInput id="confirm-password" name="confirm" required minLength={10} autoComplete="new-password" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} min-h-12 text-[15px]`}>
        {pending ? "Saving…" : "Save and sign in"}
      </button>
    </form>
  );
}
