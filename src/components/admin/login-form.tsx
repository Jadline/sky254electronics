"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";
import { EmailInput, PasswordInput } from "@/components/admin/auth-fields";
import { buttonClass, FormMessage } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const onSubmit = useKeepValues(action);
  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-semibold">
          Email
        </label>
        <EmailInput id="login-email" name="email" required placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-semibold">
            Password
          </label>
          <Link href="/admin/forgot-password" className="text-sm font-medium text-adm-primary hover:text-adm-primary-dark hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="login-password" name="password" required autoComplete="current-password" />
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} min-h-12 text-[15px]`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
