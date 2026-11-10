import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 text-adm-ink">
      <div className="fade-up w-full max-w-[400px] rounded-[24px] border border-adm-line bg-white p-8 shadow-[0_24px_60px_rgba(11,27,51,0.08)]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-[11px] bg-adm-primary text-base font-bold text-white">
            S
          </span>
          <span className="flex flex-col leading-[1.1]">
            <span className="text-xl font-bold tracking-[-0.4px]">
              Sky<span className="text-adm-primary">254</span>
            </span>
            <span className="text-xs font-medium tracking-[0.6px] text-adm-muted">SHOP ADMIN</span>
          </span>
        </div>
        <h1 className="mt-6 text-[22px] font-semibold">Sign in to the dashboard</h1>
        <p className="mt-1 mb-6 text-sm text-adm-muted">For the Sky254 team only.</p>
        <LoginForm />
        <Link href="/" className="mt-6 block text-center text-sm text-adm-muted hover:text-adm-ink">
          ← Back to the shop
        </Link>
      </div>
    </main>
  );
}
