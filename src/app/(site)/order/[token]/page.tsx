import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveUpdates } from "@/components/live-updates";
import { CheckoutSteps } from "@/components/shop/checkout-steps";
import { site, whatsappLink } from "@/config/site";
import { getShopSettings } from "@/lib/catalog";
import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatDate,
  formatPhone,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/order-labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKes } from "@/lib/types";

// Private to whoever has the link: keep it out of search engines and other sites' logs.
export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const PROGRESS: OrderStatus[] = ["pending", "confirmed", "out_for_delivery", "completed"];

type Params = Promise<{ token: string }>;

async function OrderDetails({ params }: { params: Params }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) notFound();

  const [{ data: order }, settings] = await Promise.all([
    createAdminClient()
      .from("orders")
      .select("*, order_items(product_name, price_kes, qty, line_total_kes)")
      .eq("access_token", token)
      .maybeSingle(),
    getShopSettings(),
  ]);
  if (!order) notFound();

  const status = order.status as OrderStatus;
  const method = order.delivery_method as DeliveryMethod;
  const reached = PROGRESS.indexOf(status);
  const whatsapp = whatsappLink(`Hi Sky254, I'm asking about my order ${order.order_number}.`);
  const items = order.order_items as { product_name: string; price_kes: number; qty: number; line_total_kes: number }[];

  return (
    <div className="flex max-w-[1000px] flex-col gap-[30px]">
      {/* Status changes from the dashboard show up without a reload. */}
      <LiveUpdates topic={`order:${order.id}`} />
      <CheckoutSteps current={2} />

      <section className="fade-up flex flex-col gap-2 bg-tint p-6">
        <h1 className="text-[26px] font-light">
          {status === "cancelled" ? "This order was cancelled" : <>Thank you, <strong className="font-medium">{order.customer_name.split(" ")[0]}</strong></>}
        </h1>
        <p className="text-sm text-body">
          Order <strong className="font-medium text-text">{order.order_number}</strong>, placed {formatDate(order.created_at)}.
          {status === "pending" && ` We'll call you on ${formatPhone(order.customer_phone)} to confirm it.`}
        </p>
        <p className="text-xs text-muted">Keep this page&apos;s link to check your order later.</p>
      </section>

      {status !== "cancelled" && (
        <ol aria-label="Order progress" className="flex flex-wrap gap-y-3 border border-line p-6">
          {PROGRESS.map((step, i) => (
            <li key={step} aria-current={i === reached ? "step" : undefined} className="flex flex-[1_1_140px] items-center gap-2.5 text-[13px]">
              <span className={`flex size-7 flex-none items-center justify-center rounded-full text-xs font-medium ${i <= reached ? "bg-brand text-white" : "bg-[#f2f4f8] text-muted"}`}>
                {i < reached ? "✓" : i + 1}
              </span>
              <span className={i <= reached ? "font-medium" : "text-muted"}>{ORDER_STATUSES[step]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-start gap-[30px]">
        <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 border border-line p-6">
          <h2 className="text-[15px] font-medium uppercase">Items</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {items.map((item) => (
              <li key={item.product_name} className="flex justify-between gap-4">
                <span>{item.qty} x {item.product_name}</span>
                <span className="font-medium whitespace-nowrap">{formatKes(item.line_total_kes)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 border-t border-line pt-3.5 text-sm">
            <div className="flex justify-between gap-4"><span className="text-body">Subtotal</span><span>{formatKes(order.subtotal_kes)}</span></div>
            {order.discount_kes > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-body">Coupon {order.coupon_code}</span>
                <span className="text-[#15803d]">−{formatKes(order.discount_kes)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-body">Delivery</span>
              <span>
                {order.delivery_fee_kes != null
                  ? order.delivery_fee_kes === 0 ? "Free" : formatKes(order.delivery_fee_kes)
                  : method === "pickup" ? "Free" : "To be confirmed"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
              <span className="font-medium">Total</span>
              <span className="text-xl font-medium text-brand">{formatKes(order.total_kes)}</span>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 border border-line p-6 text-sm">
          <div>
            <h2 className="mb-1.5 text-[15px] font-medium uppercase">Delivery</h2>
            <p>{DELIVERY_METHODS[method].label}</p>
            {order.delivery_address && <p className="text-body">{order.delivery_address}</p>}
            {method === "pickup" && <p className="text-body">{settings.address ? `${settings.address}, Nairobi` : "Our Nairobi shop"}</p>}
          </div>
          <div>
            <h2 className="mb-1.5 text-[15px] font-medium uppercase">Payment</h2>
            <p>{PAYMENT_STATUSES[order.payment_status as PaymentStatus]}</p>
            {order.payment_status === "unpaid" && <p className="text-body">Pay by M-Pesa or cash. We&apos;ll explain when we call.</p>}
          </div>
          <div>
            <h2 className="mb-1.5 text-[15px] font-medium uppercase">Questions?</h2>
            <p className="text-body">Call us on {site.phone}.</p>
            {whatsapp && <a href={whatsapp} className="font-medium text-brand">Message us on WhatsApp</a>}
          </div>
        </section>
      </div>

      <Link href="/shop" className="self-start text-sm font-medium text-brand">← Continue shopping</Link>
    </div>
  );
}

export default function OrderPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[1860px] flex-1 px-6 pt-[50px] pb-[90px] lg:pl-[324px]">
      <Suspense fallback={<p className="text-muted">Loading your order…</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </main>
  );
}
