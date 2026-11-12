"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/admin/actions";
import { PasswordInput } from "@/components/admin/auth-fields";
import { buttonClass, FormMessage } from "@/components/admin/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} aria-labelledby="pw-h" className="flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-[22px] py-5">
      <div>
        <h2 id="pw-h" className="text-lg font-semibold">
          Change password
        </h2>
        <p className="mt-0.5 text-sm text-adm-muted">At least 10 characters.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        New password
        <PasswordInput name="password" required minLength={10} autoComplete="new-password" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Repeat new password
        <PasswordInput name="confirm" required minLength={10} autoComplete="new-password" />
      </label>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} self-start`}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
