import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShopIllustration } from "@/components/admin/auth-illustrations";
import { LogoMark } from "@/components/logo-mark";

function Logo({ onBlue = false }: { onBlue?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`flex size-10 items-center justify-center rounded-[11px] ${
          onBlue ? "bg-white shadow-[0_6px_20px_rgba(0,0,0,0.15)]" : "bg-[#0b1b33]"
        }`}
      >
        {onBlue ? <LogoMark className="h-8 w-auto" /> : <LogoMark dark background="#0b1b33" className="h-8 w-auto" />}
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span className="text-xl font-bold tracking-[-0.4px]">
          Sky<span className={onBlue ? "text-[#9cc8ff]" : "text-adm-primary"}>254</span>
        </span>
        <span className={`text-xs font-medium tracking-[0.6px] ${onBlue ? "text-white/70" : "text-adm-muted"}`}>SHOP ADMIN</span>
      </span>
    </span>
  );
}

const FEATURES = [
  { icon: ShoppingBagIcon, title: "Orders and M-Pesa payments", text: "See new orders the moment they come in." },
  { icon: CubeIcon, title: "Products, prices and stock", text: "Update the shop in a few clicks." },
  { icon: ChatBubbleLeftRightIcon, title: "Reviews and enquiries", text: "Reply to customers in one place." },
];

/** The sign-in pages: a blue brand panel with a drawing on wide screens, and the form beside it under its own small drawing. */
export function AuthLayout({
  title,
  description,
  art,
  children,
}: {
  title: string;
  description: ReactNode;
  art: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="grid flex-1 text-adm-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-adm-primary via-[#0560c4] to-[#033f82] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Soft light and a faint dot grid, purely decorative. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 size-[420px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-[480px] rounded-full bg-[#38bdf8]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] bg-[length:22px_22px]" />
        </div>

        <div className="relative">
          <Logo onBlue />
        </div>

        <div className="relative flex flex-col gap-8 py-8">
          <ShopIllustration className="fade-up mx-auto max-h-[38vh] w-full max-w-[500px]" />
          <div className="max-w-[500px]">
            <h2 className="text-[32px] leading-[1.15] font-bold tracking-[-0.8px] xl:text-[38px]">Everything the shop needs, in one place.</h2>
            <p className="mt-3 text-base text-white/75">Sign in to manage orders, products and customers for Sky254 Electronics.</p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15">
                    <Icon aria-hidden className="size-[18px]" />
                  </span>
                  <span>
                    <span className="font-semibold">{title}.</span> <span className="text-white/70">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-white/65">
          <ShieldCheckIcon aria-hidden className="size-[18px]" />
          Private dashboard for the Sky254 team.
        </p>
      </aside>

      <section className="flex flex-col bg-adm-surface px-4 py-8 sm:px-8 lg:bg-white">
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="fade-up w-full max-w-[400px] rounded-[24px] border border-adm-line bg-white p-7 shadow-[0_24px_60px_rgba(11,27,51,0.08)] sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            <div className="mb-5 w-[112px]">{art}</div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px]">{title}</h1>
            <div className="mt-1.5 mb-7 text-[15px] text-adm-muted">{description}</div>
            {children}
          </div>
        </div>
        <Link href="/" className="mx-auto inline-flex items-center gap-1.5 text-sm text-adm-muted transition-colors hover:text-adm-ink">
          <ArrowLeftIcon aria-hidden className="size-4" />
          Back to the shop
        </Link>
      </section>
    </main>
  );
}
