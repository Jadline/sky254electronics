import type { Metadata } from "next";
import { SignInArt } from "@/components/admin/auth-illustrations";
import { AuthLayout } from "@/components/admin/auth-layout";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthLayout art={<SignInArt />} title="Welcome back" description="Sign in to the Sky254 dashboard.">
      <LoginForm />
    </AuthLayout>
  );
}
