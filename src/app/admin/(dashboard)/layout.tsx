import Link from "next/link";
import { logout } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Products" },
  { href: "/admin/products/new", label: "Add product" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/account", label: "Account" },
];

// The shell holds no data. Each page checks the user is an admin before loading anything.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-ink text-white">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3.5">
          <Link href="/admin" className="text-xl font-bold tracking-tight">
            Sky<span className="text-accent">254</span> <span className="text-sm font-normal text-on-ink">Admin</span>
          </Link>
          <nav aria-label="Dashboard" className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-on-ink transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="text-on-ink transition-colors hover:text-white">View shop</Link>
            <form action={logout}>
              <button type="submit" className="cursor-pointer text-on-ink transition-colors hover:text-white">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8">{children}</div>
    </>
  );
}
