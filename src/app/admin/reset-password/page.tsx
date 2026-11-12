import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewPasswordArt } from "@/components/admin/auth-illustrations";
import { AuthLayout } from "@/components/admin/auth-layout";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { buttonClass, Loading } from "@/components/admin/ui";
import { getAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Choose a new password" };

/** The reset link signs the admin in first, so without a session the link didn't work. */
async function ResetBody() {
  const admin = await getAdmin();
  if (!admin) {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="rounded-xl border border-[#fedf89] bg-[#fffaeb] px-3.5 py-3 text-sm text-[#93370d]">
          This page needs a fresh reset link. Yours may have expired or been opened in a different browser.
        </p>
        <Link href="/admin/forgot-password" className={`${buttonClass.primary} min-h-12 text-[15px]`}>
          Get a new link
        </Link>
      </div>
    );
  }
  return (
    <>
      <p className="-mt-4 mb-6 text-sm text-adm-muted">
        For <span className="font-medium break-all text-adm-ink">{admin.user.email}</span>
      </p>
      <ResetPasswordForm />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout art={<NewPasswordArt />} title="Choose a new password" description="You'll go straight to the dashboard after saving it.">
      <Suspense fallback={<Loading />}>
        <ResetBody />
      </Suspense>
    </AuthLayout>
  );
}
