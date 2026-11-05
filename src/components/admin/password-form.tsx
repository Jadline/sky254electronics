"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/admin/actions";
import { FIELD, FormMessage, PRIMARY_BUTTON } from "@/components/admin/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="flex flex-col gap-4 border border-line bg-white p-6">
      <h2 className="text-lg font-medium">Change password</h2>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        New password
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Repeat new password
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={FIELD} />
      </label>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
