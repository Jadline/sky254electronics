import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm } from "@/components/admin/password-form";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Account" };

async function Account() {
  const { user } = await requireAdmin();
  return (
    <>
      <p className="text-sm text-muted">Signed in as {user.email}</p>
      <PasswordForm />
    </>
  );
}

export default function AccountPage() {
  return (
    <main className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-medium">Account</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}
