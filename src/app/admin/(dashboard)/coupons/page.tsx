import type { Metadata } from "next";
import { Suspense } from "react";
import { CouponManager, type CouponRow } from "@/components/admin/coupon-manager";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Coupons" };

async function Coupons() {
  const { supabase } = await requireAdmin();
  const [coupons, orders] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, kind, value, min_subtotal_kes, max_discount_kes, starts_at, ends_at, max_uses, once_per_customer, is_active, note, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("coupon_code, discount_kes").not("coupon_code", "is", null).neq("status", "cancelled"),
  ]);
  if (coupons.error) {
    return <Empty>Coupons aren&apos;t set up in the database yet. Run the coupons migration in the Supabase SQL Editor, then reload.</Empty>;
  }

  // How often each code was used on orders that weren't cancelled, and what it gave away.
  const usage = new Map<string, { uses: number; discountKes: number }>();
  for (const order of orders.data ?? []) {
    const u = usage.get(order.coupon_code!) ?? { uses: 0, discountKes: 0 };
    u.uses += 1;
    u.discountKes += order.discount_kes;
    usage.set(order.coupon_code!, u);
  }
  const rows: CouponRow[] = coupons.data.map((c) => ({ ...c, ...(usage.get(c.code) ?? { uses: 0, discountKes: 0 }) }));
  return <CouponManager rows={rows} />;
}

export default function CouponsPage() {
  return (
    <>
      <PageHeader title="Coupons" description="Codes customers type at checkout for money off. Uses count orders that weren't cancelled." />
      <Suspense fallback={<Loading />}>
        <Coupons />
      </Suspense>
    </>
  );
}
