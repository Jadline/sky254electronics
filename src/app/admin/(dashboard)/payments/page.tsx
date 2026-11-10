import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsList, type PaymentRow } from "@/components/admin/payments-list";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Payments" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Mpesa = {
  id: string;
  phone: string;
  amount_kes: number;
  status: "pending" | "paid" | "failed";
  receipt_number: string | null;
  result_desc: string | null;
  created_at: string;
  orders: { id: string; order_number: string; customer_name: string; status: string } | null;
};
type CashOrder = { id: string; order_number: string; customer_name: string; customer_phone: string; total_kes: number; payment_status: string; created_at: string; updated_at: string };

/** M-Pesa attempts from Safaricom, plus cash orders: everything the shop has been, or is still to be, paid. */
async function Payments({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [mpesa, cash] = await Promise.all([
    supabase
      .from("mpesa_payments")
      .select("id, phone, amount_kes, status, receipt_number, result_desc, created_at, orders(id, order_number, customer_name, status)")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total_kes, payment_status, created_at, updated_at")
      .eq("payment_method", "cash")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  if (mpesa.error) throw new Error(`Couldn't load payments: ${mpesa.error.message}`);
  if (cash.error) throw new Error(`Couldn't load cash orders: ${cash.error.message}`);

  const rows: PaymentRow[] = [
    ...(mpesa.data as unknown as Mpesa[]).map((p) => ({
      id: p.id,
      kind: "mpesa" as const,
      orderId: p.orders?.id ?? null,
      orderNumber: p.orders?.order_number ?? "—",
      customer: p.orders?.customer_name ?? "—",
      phone: p.phone,
      amount: p.amount_kes,
      state: p.status,
      reference: p.receipt_number ?? "",
      note: p.status === "failed" ? p.result_desc || "Cancelled or timed out" : p.status === "pending" ? "Waiting for the customer to enter their PIN" : "",
      cancelledOrder: p.orders?.status === "cancelled",
      when: p.created_at,
    })),
    ...(cash.data as CashOrder[]).map((o) => ({
      id: `cash-${o.id}`,
      kind: "cash" as const,
      orderId: o.id,
      orderNumber: o.order_number,
      customer: o.customer_name,
      phone: o.customer_phone,
      amount: o.total_kes,
      state: o.payment_status === "paid" ? ("paid" as const) : ("due" as const),
      reference: "",
      note: o.payment_status === "paid" ? "Cash received" : "To collect on delivery or pickup",
      cancelledOrder: false,
      when: o.payment_status === "paid" ? o.updated_at : o.created_at,
    })),
  ].sort((a, b) => b.when.localeCompare(a.when));

  const status = typeof params.status === "string" ? params.status : "";
  return <PaymentsList key={status} payments={rows} initialStatus={status} />;
}

export default function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Payments" description="M-Pesa payments confirmed by Safaricom, and cash still to collect." />
      <Suspense fallback={<Loading label="Loading payments…" />}>
        <Payments searchParams={searchParams} />
      </Suspense>
    </>
  );
}
