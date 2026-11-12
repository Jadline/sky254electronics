import type { Metadata } from "next";
import { Suspense } from "react";
import { DeliveryManager, type OptionRow, type PointRow } from "@/components/admin/delivery-manager";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Delivery" };

async function Delivery() {
  const { supabase } = await requireAdmin();
  const [options, points, orders, settings] = await Promise.all([
    supabase.from("delivery_options").select("id, name, areas, town, cost_kes, own_rider, is_active").order("sort_order").order("created_at"),
    supabase.from("pickup_points").select("id, name, address, hours, is_active").order("sort_order").order("created_at"),
    supabase.from("orders").select("delivery_option_id, pickup_point_id").or("delivery_option_id.not.is.null,pickup_point_id.not.is.null").limit(20000),
    supabase.from("shop_settings").select("free_delivery_over_kes").eq("id", 1).maybeSingle(),
  ]);
  if (options.error || points.error) {
    return <Empty>Delivery isn&apos;t set up in the database yet. Run the delivery migration in the Supabase SQL Editor, then reload.</Empty>;
  }

  // How many orders used each option or pickup point.
  const used = new Map<string, number>();
  for (const o of orders.data ?? []) {
    const key = o.delivery_option_id ?? o.pickup_point_id;
    if (key) used.set(key, (used.get(key) ?? 0) + 1);
  }
  const optionRows: OptionRow[] = options.data.map((o) => ({ ...o, used: used.get(o.id) ?? 0 }));
  const pointRows: PointRow[] = points.data.map((p) => ({ ...p, used: used.get(p.id) ?? 0 }));
  return <DeliveryManager options={optionRows} points={pointRows} freeOver={settings.data?.free_delivery_over_kes ?? null} />;
}

export default function DeliveryPage() {
  return (
    <>
      <PageHeader title="Delivery" />
      <Suspense fallback={<Loading />}>
        <Delivery />
      </Suspense>
    </>
  );
}
