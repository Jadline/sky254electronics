"use client";

import { ArrowRightStartOnRectangleIcon, ArrowTopRightOnSquareIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { logout } from "@/app/admin/actions";

export type BadgeKey = "orders" | "payments";

type Item = { name: string; href: string; exact?: boolean; badge?: BadgeKey; also?: string[] };

const SECTIONS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [{ name: "Dashboard", href: "/admin", exact: true }] },
  {
    title: "Sales",
    items: [
      { name: "Orders", href: "/admin/orders", badge: "orders" },
      { name: "Payments", href: "/admin/payments", badge: "payments" },
      { name: "Customers", href: "/admin/customers" },
      { name: "Subscribers", href: "/admin/subscribers" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { name: "Products", href: "/admin/products" },
      { name: "Categories", href: "/admin/categories" },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "Shop settings", href: "/admin/settings" },
      { name: "Pages", href: "/admin/pages" },
      { name: "Account", href: "/admin/account" },
    ],
  },
];

/** Badge counts stream in after the shell, so each one arrives as its own element. */
export type ShellBadges = Partial<Record<BadgeKey, ReactNode>>;

type NavProps = { badges: ShellBadges; onNavigate?: () => void };

/**
 * The address is only known at request time, so the highlighted link streams in. Until then
 * the same links show with none highlighted, so the sidebar never jumps.
 */
function Nav(props: NavProps) {
  return (
    <Suspense fallback={<NavLinks {...props} pathname={null} />}>
      <CurrentNav {...props} />
    </Suspense>
  );
}

function CurrentNav(props: NavProps) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

function NavLinks({ badges, onNavigate, pathname }: NavProps & { pathname: string | null }) {
  const isActive = (href: string, exact?: boolean) =>
    pathname != null && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav className="flex flex-col gap-[18px]" aria-label="Admin">
      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          <p className="px-2.5 pb-1 text-xs font-semibold tracking-[0.8px] text-adm-faint uppercase">{section.title}</p>
          {section.items.map((item) => {
            const active = isActive(item.href, item.exact) || (item.also ?? []).some((href) => isActive(href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[15px] transition-colors ${
                  active ? "bg-adm-tint font-semibold text-adm-primary-dark" : "font-medium text-adm-ink hover:bg-adm-surface"
                }`}
              >
                <span aria-hidden className={`size-2 rounded-full ${active ? "bg-adm-primary" : "bg-adm-line-strong"}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && badges[item.badge]}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2 py-1 text-adm-ink">
      <span aria-hidden className="flex size-9 items-center justify-center rounded-[10px] bg-adm-primary text-[15px] font-bold text-white">
        S
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span className="text-xl font-bold tracking-[-0.4px]">
          Sky<span className="text-adm-primary">254</span>
        </span>
        <span className="text-xs font-medium tracking-[0.6px] text-adm-muted">SHOP ADMIN</span>
      </span>
    </Link>
  );
}

function Footer({ user }: { user: ReactNode }) {
  return (
    <div className="mt-auto flex flex-col gap-2.5 pt-6">
      <Link
        href="/"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-[1.5px] border-adm-line-strong text-sm font-semibold text-adm-ink hover:bg-adm-surface"
      >
        View the shop <ArrowTopRightOnSquareIcon className="size-4" aria-hidden />
      </Link>
      <div className="flex items-center gap-2.5 rounded-xl bg-adm-surface p-2.5">
        <div className="min-w-0 flex-1">{user}</div>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full text-adm-muted transition-colors hover:bg-white hover:text-adm-ink"
          >
            <ArrowRightStartOnRectangleIcon className="size-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

/** White sidebar on desktop, a menu button on phones. Pages draw their own header (PageHeader). */
export function AdminShell({ user, badges, children }: { user: ReactNode; badges: ShellBadges; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-1 bg-adm-surface text-[15px] text-adm-ink">
      <aside className="hidden w-[248px] shrink-0 border-r border-adm-line bg-white lg:block">
        <div className="sticky top-0 flex max-h-screen min-h-screen flex-col gap-[22px] overflow-y-auto px-3.5 py-5">
          <Brand />
          <Nav badges={badges} />
          <Footer user={user} />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-adm-ink/30" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-[22px] overflow-y-auto bg-white px-3.5 py-5 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="cursor-pointer rounded-full p-2 text-adm-muted hover:bg-adm-surface">
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <Nav badges={badges} onNavigate={() => setOpen(false)} />
            <Footer user={user} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-adm-line bg-white px-4 py-2.5 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="cursor-pointer rounded-full p-2 text-adm-ink hover:bg-adm-surface" aria-label="Open menu">
            <Bars3Icon className="size-6" />
          </button>
          <Brand />
          <span className="w-10" />
        </div>
        <main className="flex-1 px-4 pt-0 pb-8 sm:px-7">{children}</main>
      </div>
    </div>
  );
}

/** The red count beside a sidebar link. */
export function NavCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#fde9e2] px-[7px] text-xs font-bold text-[#b23a14]">
      {count}
      <span className="sr-only"> need attention</span>
    </span>
  );
}
