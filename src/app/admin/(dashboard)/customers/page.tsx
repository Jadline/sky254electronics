import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomersList, type CustomerRow } from "@/components/admin/customers-list";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import type { DeliveryMethod } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Customers" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Row = {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  status: string;
  total_kes: number;
  created_at: string;
};

/**
 * Everyone who has ordered, grouped by phone number (checkout always asks for one).
 * Customers appear when they order; there are no accounts to add here.
 */
async function Customers({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("customer_name, customer_phone, customer_email, delivery_method, delivery_address, status, total_kes, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Couldn't load customers: ${error.message}`);

  // Newest order first, so the first row seen for a phone holds the latest name and address.
  const byPhone = new Map<string, CustomerRow>();
  for (const o of data as Row[]) {
    const c = byPhone.get(o.customer_phone) ?? {
      phone: o.customer_phone,
      name: o.customer_name,
      email: o.customer_email ?? "",
      address: o.delivery_method === "pickup" ? "Picks up from the shop" : (o.delivery_address ?? ""),
      orders: 0,
      cancelled: 0,
      spent: 0,
      first: o.created_at,
      last: o.created_at,
    };
    if (!c.email && o.customer_email) c.email = o.customer_email;
    // Cancelled orders count neither as orders nor towards what a customer has spent.
    if (o.status === "cancelled") c.cancelled += 1;
    else {
      c.orders += 1;
      c.spent += o.total_kes;
    }
    c.first = o.created_at;
    byPhone.set(o.customer_phone, c);
  }

  const q = typeof params.q === "string" ? params.q : "";
  return <CustomersList key={q} customers={[...byPhone.values()]} initialQuery={q} />;
}

export default function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered, by phone number. Customers appear here when they check out." />
      <Suspense fallback={<Loading label="Loading customers…" />}>
        <Customers searchParams={searchParams} />
      </Suspense>
    </>
  );
}
