import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="text-3xl leading-none font-bold tracking-tight">
          Sky<span className="text-brand">254</span>
        </p>
        <h1 className="mt-4 mb-6 text-lg font-medium">Sign in to the dashboard</h1>
        <LoginForm />
      </div>
    </main>
  );
}
