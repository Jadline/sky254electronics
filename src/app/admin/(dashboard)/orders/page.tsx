import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTable, type AdminOrderRow } from "@/components/admin/order-table";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate, formatPhone, type OrderStatus, type PaymentStatus } from "@/lib/order-labels";

export const metadata: Metadata = { title: "Orders" };

async function Orders() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, customer_name, customer_phone, total_kes, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Couldn't load orders: ${error.message}`);

  const rows: AdminOrderRow[] = data.map((order) => ({
    id: order.id,
    number: order.order_number,
    status: order.status as OrderStatus,
    paymentStatus: order.payment_status as PaymentStatus,
    customer: order.customer_name,
    phone: formatPhone(order.customer_phone),
    totalKes: order.total_kes,
    placed: formatDate(order.created_at),
  }));
  return <OrderTable rows={rows} />;
}

export default function AdminOrdersPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Orders</h1>
      <Suspense fallback={<p className="text-muted">Loading orders…</p>}>
        <Orders />
      </Suspense>
    </main>
  );
}
