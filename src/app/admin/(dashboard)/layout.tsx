import { cache, Suspense } from "react";
import { AdminShell, NavCount } from "@/components/admin/admin-shell";
import { LiveUpdates } from "@/components/live-updates";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { initials } from "@/components/admin/ui";
import { adminName, getAdmin } from "@/lib/admin-auth";

/** Sidebar counts: new orders waiting to be confirmed, and failed M-Pesa payments on live orders. */
const loadBadges = cache(async () => {
  const admin = await getAdmin();
  if (!admin) return { orders: 0, payments: 0 };
  const count = { count: "exact" as const, head: true };
  const [orders, payments] = await Promise.all([
    admin.supabase.from("orders").select("id", count).eq("status", "pending"),
    admin.supabase.from("orders").select("id", count).eq("payment_status", "failed").neq("status", "cancelled"),
  ]);
  return { orders: orders.count ?? 0, payments: payments.count ?? 0 };
});

async function Count({ kind }: { kind: "orders" | "payments" }) {
  const badges = await loadBadges();
  return <NavCount count={badges[kind]} />;
}

async function SignedInAs() {
  const admin = await getAdmin();
  if (!admin) return null;
  const name = adminName(admin.user);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-adm-primary text-sm font-semibold text-white">
        {initials(name)}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="truncate text-[13px] text-adm-muted" title={admin.user.email}>
          {admin.user.email}
        </span>
      </span>
    </span>
  );
}

/**
 * The shell is static, so it shows at once. Anything that reads the login (the badges and the
 * name) streams in behind its own boundary, and every page checks the admin itself.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell
      user={
        <Suspense fallback={<span className="block h-9" />}>
          <SignedInAs />
        </Suspense>
      }
      badges={{
        orders: (
          <Suspense fallback={null}>
            <Count kind="orders" />
          </Suspense>
        ),
        payments: (
          <Suspense fallback={null}>
            <Count kind="payments" />
          </Suspense>
        ),
      }}
    >
      {/* New orders and changes saved in another tab show up without a reload. */}
      <LiveRefresh everySeconds={30} />
      <LiveUpdates topic="catalog" />
      {children}
    </AdminShell>
  );
}
