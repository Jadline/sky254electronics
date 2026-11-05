import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderEditor } from "@/components/admin/order-editor";
import { requireAdmin } from "@/lib/admin-auth";
import {
  DELIVERY_METHODS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  formatDate,
  formatPhone,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/order-labels";
import { formatKes } from "@/lib/types";

export const metadata: Metadata = { title: "Order" };

type Params = Promise<{ id: string }>;

async function OrderDetail({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, price_kes, qty, line_total_kes)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const items = order.order_items as { id: string; product_name: string; price_kes: number; qty: number; line_total_kes: number }[];
  const method = order.delivery_method as DeliveryMethod;
  // A WhatsApp link needs no app setup here: wa.me opens a chat with the customer.
  const chat = `https://wa.me/${order.customer_phone}?text=${encodeURIComponent(`Hi ${order.customer_name.split(" ")[0]}, this is Sky254 about your order ${order.order_number}.`)}`;

  return (
    <>
      <div>
        <Link href="/admin/orders" className="text-sm text-brand">← All orders</Link>
        <h1 className="mt-1 text-2xl font-medium">{order.order_number}</h1>
        <p className="text-sm text-muted">Placed {formatDate(order.created_at)}</p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_420px] flex-col gap-6">
          <section className="flex flex-col gap-3 border border-line bg-white p-6">
            <h2 className="text-lg font-medium">Items</h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 border-b border-line pb-2.5 last:border-b-0">
                  <span>
                    {item.qty} x {item.product_name}
                    <span className="block text-xs text-muted">{formatKes(item.price_kes)} each</span>
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatKes(item.line_total_kes)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><span className="text-body">Subtotal</span><span>{formatKes(order.subtotal_kes)}</span></div>
              <div className="flex justify-between">
                <span className="text-body">Delivery</span>
                <span>{order.delivery_fee_kes == null ? "Not set" : formatKes(order.delivery_fee_kes)}</span>
              </div>
              <div className="flex justify-between text-base font-medium"><span>Total</span><span>{formatKes(order.total_kes)}</span></div>
            </div>
          </section>

          <section className="grid gap-5 border border-line bg-white p-6 text-sm md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <h2 className="mb-1 text-lg font-medium">Customer</h2>
              <p>{order.customer_name}</p>
              <a href={`tel:+${order.customer_phone}`} className="text-brand">{formatPhone(order.customer_phone)}</a>
              <a href={chat} target="_blank" rel="noreferrer" className="text-brand">Message on WhatsApp</a>
              {order.customer_email && <a href={`mailto:${order.customer_email}`} className="text-brand">{order.customer_email}</a>}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="mb-1 text-lg font-medium">Delivery</h2>
              <p>{DELIVERY_METHODS[method].label}</p>
              {order.delivery_address && <p className="text-body">{order.delivery_address}</p>}
            </div>
            {order.notes && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <h2 className="mb-1 text-lg font-medium">Customer notes</h2>
                <p className="whitespace-pre-wrap text-body">{order.notes}</p>
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 flex-[1_1_300px]">
          <OrderEditor
            id={order.id}
            status={order.status as OrderStatus}
            deliveryFee={order.delivery_fee_kes}
            paymentMethodLabel={PAYMENT_METHODS[order.payment_method as PaymentMethod]}
            paymentStatusLabel={PAYMENT_STATUSES[order.payment_status as PaymentStatus]}
            isCash={order.payment_method === "cash"}
            isPaid={order.payment_status === "paid"}
          />
        </div>
      </div>
    </>
  );
}

export default function AdminOrderPage({ params }: { params: Params }) {
  return (
    <main className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <OrderDetail params={params} />
      </Suspense>
    </main>
  );
}
