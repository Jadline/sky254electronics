"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";
import { buttonClass, FIELD, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const onSubmit = useKeepValues(action);
  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="username" className={`${FIELD} font-normal`} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={`${FIELD} font-normal`} />
      </label>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} mt-1`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
