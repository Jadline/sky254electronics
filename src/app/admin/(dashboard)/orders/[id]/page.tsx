import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderEditor } from "@/components/admin/order-editor";
import { Badge, formatDateTime, initials, ksh, Loading, plural } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import {
  DELIVERY,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATE,
  paymentState,
  prettyPhone,
  whatsappLink,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Order" };

type Params = Promise<{ id: string }>;

const card = "rounded-[20px] border border-adm-line bg-white";

type Item = { id: string; product_id: string | null; product_name: string; price_kes: number; qty: number; line_total_kes: number };
type Payment = { id: string; phone: string; amount_kes: number; status: string; receipt_number: string | null; result_desc: string | null; created_at: string };

async function OrderDetail({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, product_name, price_kes, qty, line_total_kes), mpesa_payments(id, phone, amount_kes, status, receipt_number, result_desc, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  const { count: customerOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", order.customer_phone);

  const items = order.order_items as Item[];
  const payments = [...(order.mpesa_payments as Payment[])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const status = order.status as OrderStatus;
  const method = order.delivery_method as DeliveryMethod;
  const payMethod = order.payment_method as PaymentMethod;
  const isPickup = method === "pickup";
  const pay = PAYMENT_STATE[paymentState(order)];
  const st = ORDER_STATUS[status];
  const firstName = String(order.customer_name).split(" ")[0];
  const chat = whatsappLink(order.customer_phone, `Hi ${firstName}, this is Sky254 about your order ${order.order_number}.`);

  // The order's activity: only what has happened, oldest first.
  const activity: { title: string; text: string; when?: string; tone?: "done" | "failed" }[] = [
    {
      title: "Order placed",
      text: `On the website · ${order.delivery_option_name ?? DELIVERY[method].label} · ${PAYMENT_METHOD[payMethod]}`,
      when: order.created_at,
    },
    ...payments.map((p) => ({
      title: p.status === "paid" ? "M-Pesa payment received" : p.status === "failed" ? "M-Pesa payment failed" : "M-Pesa prompt sent",
      text:
        p.status === "paid"
          ? `${ksh(p.amount_kes)} from ${prettyPhone(p.phone)}${p.receipt_number ? ` · receipt ${p.receipt_number}` : ""}`
          : p.status === "failed"
            ? `${p.result_desc || "Cancelled or timed out"} · ${prettyPhone(p.phone)}`
            : `${ksh(p.amount_kes)} to ${prettyPhone(p.phone)}, waiting for the customer`,
      when: p.created_at,
      tone: p.status === "failed" ? ("failed" as const) : ("done" as const),
    })),
  ];
  if (payMethod === "cash" && order.payment_status === "paid") activity.push({ title: "Cash received", text: `${ksh(order.total_kes)} marked as paid` });
  if (status !== "pending") {
    activity.push({
      title: status === "completed" && isPickup ? "Collected" : st.label,
      text:
        status === "confirmed"
          ? "The shop confirmed the order with the customer"
          : status === "out_for_delivery"
            ? "On its way to the customer"
            : status === "completed"
              ? isPickup
                ? "Collected from the shop"
                : "Delivered to the customer"
              : "Cancelled by the shop",
      when: order.updated_at,
      tone: status === "cancelled" ? "failed" : "done",
    });
  }

  return (
    <div className="flex flex-col gap-[18px] pt-6 sm:pt-7">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 self-start text-sm text-adm-body hover:text-adm-ink">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-semibold tracking-[-0.3px]">
              Order <span className="font-mono text-[22px]">{order.order_number}</span>
            </h1>
            <Badge tone={pay.tone} dot>
              {pay.label}
            </Badge>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <span className="text-sm text-adm-muted">Placed {formatDateTime(order.created_at)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-[18px]">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-[18px]">
          <section aria-labelledby="det-h" className={card}>
            <h2 id="det-h" className="px-[22px] pt-[18px] pb-2.5 text-lg font-semibold">
              Order details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
                  <tr>
                    <th scope="col" className="px-[22px] py-2.5 font-semibold">
                      Products
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                      Price
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                      Qty
                    </th>
                    <th scope="col" className="px-[22px] py-2.5 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-adm-line-soft">
                      <td className="px-[22px] py-3">
                        {item.product_id ? (
                          <Link href={`/admin/products/${item.product_id}`} className="font-semibold hover:text-adm-primary">
                            {item.product_name}
                          </Link>
                        ) : (
                          <span className="font-semibold">{item.product_name}</span>
                        )}
                        {!item.product_id && <span className="block text-[13px] text-adm-muted">No longer in the catalogue</span>}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">{ksh(item.price_kes)}</td>
                      <td className="px-3 py-3 text-right">{item.qty}</td>
                      <td className="px-[22px] py-3 text-right font-semibold whitespace-nowrap">{ksh(item.line_total_kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-t border-adm-line-soft px-[22px] pt-3.5 pb-[18px] text-sm">
              <dt className="text-adm-muted">Items</dt>
              <dd className="text-right">{plural(items.reduce((t, i) => t + i.qty, 0), "unit")}</dd>
              <dt className="text-adm-muted">Subtotal</dt>
              <dd className="text-right">{ksh(order.subtotal_kes)}</dd>
              {order.discount_kes > 0 && (
                <>
                  <dt className="text-adm-muted">
                    Coupon <span className="font-mono font-semibold text-adm-ink">{order.coupon_code}</span>
                  </dt>
                  <dd className="text-right text-[#116632]">−{ksh(order.discount_kes)}</dd>
                </>
              )}
              <dt className="text-adm-muted">{isPickup ? "Pickup" : "Delivery"}</dt>
              <dd className="text-right">
                {order.delivery_fee_kes == null ? (
                  isPickup ? (
                    "Free"
                  ) : (
                    <span className="font-medium text-adm-peach-ink">Not set yet</span>
                  )
                ) : order.delivery_fee_kes === 0 ? (
                  "Free"
                ) : (
                  ksh(order.delivery_fee_kes)
                )}
              </dd>
              <dt className="border-t border-adm-line-soft pt-2 text-base font-semibold">Total</dt>
              <dd className="border-t border-adm-line-soft pt-2 text-right text-base font-semibold">{ksh(order.total_kes)}</dd>
            </dl>
          </section>

          <section aria-labelledby="act-h" className={`${card} px-[22px] py-[18px]`}>
            <h2 id="act-h" className="mb-3.5 text-lg font-semibold">
              Order activity
            </h2>
            <ol className="flex flex-col">
              {activity.map((a, i) => (
                <li key={`${a.title}-${i}`} className="relative pb-[18px] pl-[30px] last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute top-[3px] left-0 flex size-[18px] items-center justify-center rounded-full text-white ${a.tone === "failed" ? "bg-[#b42318]" : "bg-adm-primary"}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      {a.tone === "failed" ? <path d="M7 7l10 10M17 7 7 17" /> : <path d="m5 12 5 5 9-10" />}
                    </svg>
                  </span>
                  {i < activity.length - 1 && <span aria-hidden className="absolute top-6 bottom-0 left-2 w-0.5 bg-adm-tint" />}
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                    <strong className="font-semibold">{a.title}</strong>
                    {a.when && <span className="text-[13px] text-adm-muted">{formatDateTime(a.when)}</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-adm-body">{a.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
          <OrderEditor
            id={order.id}
            status={status}
            delivery={method}
            deliveryFee={order.delivery_fee_kes}
            subtotal={order.subtotal_kes - (order.discount_kes ?? 0)}
            isCash={payMethod === "cash"}
            canMarkPaid={payMethod === "cash" || payments.length === 0}
            isPaid={order.payment_status === "paid"}
            paymentLabel={`${PAYMENT_METHOD[payMethod]} · ${pay.label}`}
          />

          <section aria-labelledby="cust-h" className={`${card} flex flex-col gap-3.5 px-5 py-[18px]`}>
            <h2 id="cust-h" className="text-lg font-semibold">
              Customer details
            </h2>
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-adm-tint font-bold text-adm-primary-dark">
                {initials(order.customer_name)}
              </span>
              <span className="flex flex-col leading-snug">
                <Link href={`/admin/customers?q=${encodeURIComponent(order.customer_phone)}`} className="font-semibold hover:text-adm-primary">
                  {order.customer_name}
                </Link>
                <span className="text-[13px] text-adm-muted">
                  {customerOrders && customerOrders > 1 ? `Returning customer · ${plural(customerOrders, "order")}` : "First order"}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1 border-t border-adm-line-soft pt-3 text-sm">
              <span className="text-[13px] font-semibold tracking-[0.6px] text-adm-muted uppercase">Contact</span>
              <span>{prettyPhone(order.customer_phone)}</span>
              <span className="break-all">{order.customer_email || "No email"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={chat}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-adm-line-strong px-3.5 text-sm font-semibold hover:bg-adm-surface"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e9e4f" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`tel:+${order.customer_phone}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-adm-line-strong px-3.5 text-sm font-semibold hover:bg-adm-surface"
              >
                <PhoneIcon className="size-4 text-adm-primary" aria-hidden />
                Call
              </a>
              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-adm-line-strong px-3.5 text-sm font-semibold hover:bg-adm-surface"
                >
                  <EnvelopeIcon className="size-4 text-adm-primary" aria-hidden />
                  Email
                </a>
              )}
            </div>
          </section>

          <section aria-labelledby="addr-h" className={`${card} px-5 py-[18px]`}>
            <h2 id="addr-h" className="mb-2.5 text-lg font-semibold">
              {isPickup ? "Pickup" : "Delivery address"}
            </h2>
            <p className="text-sm">
              {order.delivery_option_name ?? DELIVERY[method].label}
              {order.delivery_option_name && <span className="text-adm-muted"> · {DELIVERY[method].short}</span>}
            </p>
            {order.delivery_address && <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-adm-body">{order.delivery_address}</p>}
            {order.notes && (
              <p className="mt-2.5 rounded-xl bg-adm-surface px-3 py-2.5 text-[13px] whitespace-pre-wrap text-adm-body">
                <strong className="font-semibold text-adm-ink">Customer note:</strong> {order.notes}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Loading />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}
