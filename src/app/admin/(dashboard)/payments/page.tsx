import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsList, type PaymentRow } from "@/components/admin/payments-list";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { PAID_VIA, PAYMENT_METHOD_SHORT, type PaymentMethod } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Payments" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Online = {
  id: string;
  amount_kes: number;
  paid_kes: number | null;
  status: "pending" | "paid" | "failed" | "reversed";
  status_description: string | null;
  pay_method: string | null;
  pay_account: string | null;
  confirmation_code: string | null;
  created_at: string;
  updated_at: string;
  orders: { id: string; order_number: string; customer_name: string; customer_phone: string; status: string } | null;
};
type CashOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_kes: number;
  payment_method: string;
  payment_status: string;
  paid_via: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

/** Pesapal payments, plus orders paid outside the site (M-Pesa till or paybill, cash, at the shop): everything the shop has been, or is still to be, paid. */
async function Payments({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [online, cash] = await Promise.all([
    supabase
      .from("pesapal_payments")
      .select(
        "id, amount_kes, paid_kes, status, status_description, pay_method, pay_account, confirmation_code, created_at, updated_at, orders(id, order_number, customer_name, customer_phone, status)",
      )
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total_kes, payment_method, payment_status, paid_via, payment_reference, created_at, updated_at")
      .in("payment_method", ["mpesa", "cash", "shop"])
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  if (online.error) throw new Error(`Couldn't load payments: ${online.error.message}`);
  if (cash.error) throw new Error(`Couldn't load cash orders: ${cash.error.message}`);

  const rows: PaymentRow[] = [
    ...(online.data as unknown as Online[]).map((p) => ({
      id: p.id,
      kind: "online" as const,
      via: [p.pay_method, p.pay_account].filter(Boolean).join(" "),
      orderId: p.orders?.id ?? null,
      orderNumber: p.orders?.order_number ?? "—",
      customer: p.orders?.customer_name ?? "—",
      phone: p.orders?.customer_phone ?? "",
      amount: p.status === "paid" ? (p.paid_kes ?? p.amount_kes) : p.amount_kes,
      state: p.status,
      reference: p.confirmation_code ?? "",
      note:
        p.status === "failed"
          ? p.status_description || "Cancelled or declined"
          : p.status === "reversed"
            ? p.status_description || "Refunded or charged back"
            : p.status === "pending"
              ? "Opened the payment page, not paid yet"
              : "",
      cancelledOrder: p.orders?.status === "cancelled",
      when: p.status === "pending" ? p.created_at : p.updated_at,
    })),
    ...(cash.data as CashOrder[]).map((o) => ({
      id: `cash-${o.id}`,
      kind: "cash" as const,
      via: o.payment_status === "paid" ? (PAID_VIA[o.paid_via as keyof typeof PAID_VIA] ?? "") : PAYMENT_METHOD_SHORT[o.payment_method as PaymentMethod],
      orderId: o.id,
      orderNumber: o.order_number,
      customer: o.customer_name,
      phone: o.customer_phone,
      amount: o.total_kes,
      state: o.payment_status === "paid" ? ("paid" as const) : ("due" as const),
      reference: o.payment_reference ?? "",
      note: o.payment_status === "paid" ? "Marked as paid" : o.payment_method === "mpesa" ? "Waiting for the M-Pesa payment" : "To collect on delivery or pickup",
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
      <PageHeader title="Payments" description="Payments recorded on orders: M-Pesa till or paybill, cash and shop payments, plus Pesapal payments when it is switched on." />
      <Suspense fallback={<Loading label="Loading payments…" />}>
        <Payments searchParams={searchParams} />
      </Suspense>
    </>
  );
}
