import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetLinkArt } from "@/components/admin/auth-illustrations";
import { AuthLayout } from "@/components/admin/auth-layout";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

/** ?expired=1 comes from a reset link that no longer works. */
async function WithNotice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { expired } = await searchParams;
  return <ForgotPasswordForm expired={expired === "1"} />;
}

export default function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <AuthLayout art={<ResetLinkArt />} title="Forgot your password?" description="Enter your email and we'll send you a link to choose a new one.">
      <Suspense fallback={<ForgotPasswordForm />}>
        <WithNotice searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
