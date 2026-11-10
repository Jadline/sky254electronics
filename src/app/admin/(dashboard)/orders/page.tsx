import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersList, type OrderRow } from "@/components/admin/orders-list";
import { buttonClass, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { needsFee, paymentState, type DeliveryMethod, type OrderStatus, type PaymentMethod } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Row = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: DeliveryMethod;
  delivery_fee_kes: number | null;
  total_kes: number;
  created_at: string;
  order_items: { qty: number }[];
};

/** Every order, filtered in the browser: the shop has a few hundred at most. */
async function Orders({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_method, payment_status, customer_name, customer_phone, customer_email, delivery_method, delivery_fee_kes, total_kes, created_at, order_items(qty)",
    )
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Couldn't load orders: ${error.message}`);

  const rows: OrderRow[] = (data as unknown as Row[]).map((o) => ({
    id: o.id,
    number: o.order_number,
    name: o.customer_name,
    phone: o.customer_phone,
    email: o.customer_email ?? "",
    status: o.status,
    pay: paymentState(o),
    method: o.payment_method,
    delivery: o.delivery_method,
    needsFee: needsFee(o),
    placed: o.created_at,
    items: o.order_items.length,
    qty: o.order_items.reduce((t, i) => t + i.qty, 0),
    total: o.total_kes,
  }));

  const status = one(params.status);
  const q = one(params.q);
  // A new link (from the dashboard or a search) starts the list afresh with its filter.
  return <OrdersList key={`${status}|${q}`} orders={rows} initialStatus={status} initialQuery={q} />;
}

export default function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm new orders, set delivery fees and follow each one to the customer."
        action={
          // A file download, not a page: a plain link.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/admin/orders/export" className={buttonClass.outline}>
            <ArrowDownTrayIcon className="size-[18px]" aria-hidden />
            Export CSV
          </a>
        }
      />
      <Suspense fallback={<Loading label="Loading orders…" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}
