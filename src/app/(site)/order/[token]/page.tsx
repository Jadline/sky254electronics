import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveUpdates } from "@/components/live-updates";
import { CheckoutSteps } from "@/components/shop/checkout-steps";
import { ClaimPaymentForm } from "@/components/shop/claim-payment-form";
import { PayButton } from "@/components/shop/pay-button";
import { shopContact, whatsappUrl } from "@/lib/contact";
import { getShopSettings } from "@/lib/catalog";
import {
  DELIVERY_METHODS,
  PAYMENT_STATUSES,
  formatDate,
  formatPhone,
  payOnlineBlocker,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/order-labels";
import { paymentTitle, trackingSteps } from "@/lib/payment-options";
import { paymentInfo } from "@/lib/shop-payment";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKes } from "@/lib/types";

// Private to whoever has the link: keep it out of search engines and other sites' logs.
export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

/** "Then you pay ..." for each way of paying. */
function payPhrase(method: string, delivery: DeliveryMethod) {
  if (method === "mpesa") return "by M-Pesa";
  if (method === "shop") return "at the shop when you collect";
  if (method === "online") return "online, by M-Pesa or card";
  return delivery === "pickup" ? "in cash or M-Pesa when you collect" : "in cash or M-Pesa on delivery";
}

async function OrderDetails({ params }: { params: Params }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) notFound();

  const db = createAdminClient();
  const [{ data: order }, settings] = await Promise.all([
    db.from("orders").select("*, order_items(product_name, price_kes, qty, line_total_kes)").eq("access_token", token).maybeSingle(),
    getShopSettings(),
  ]);
  if (!order) notFound();
  // Where to collect a pickup order, if the pickup point still exists.
  const { data: point } = order.pickup_point_id
    ? await db.from("pickup_points").select("address, hours").eq("id", order.pickup_point_id).maybeSingle()
    : { data: null };
  // Pesapal attempts, only for "Pay now" orders, to show pending, failed and cancelled payments.
  const { data: attempts } =
    order.payment_method === "online"
      ? await db.from("pesapal_payments").select("status, created_at").eq("order_id", order.id).order("created_at", { ascending: false })
      : { data: null };

  const status = order.status as OrderStatus;
  const method = order.delivery_method as DeliveryMethod;
  const payMethod = order.payment_method as string;
  const paid = order.payment_status === "paid";
  const { payTo, confirmMinutes, pesapalOn } = paymentInfo(settings);
  const steps = trackingSteps(order);
  const contact = shopContact(settings);
  const whatsapp = whatsappUrl(contact.whatsapp, `Hi Sky254, I'm asking about my order ${order.order_number}.`);
  const items = order.order_items as { product_name: string; price_kes: number; qty: number; line_total_kes: number }[];

  const feeKnown = order.delivery_fee_kes != null || method === "pickup";
  const feeText = order.delivery_fee_kes != null ? (order.delivery_fee_kes === 0 ? "Free" : formatKes(order.delivery_fee_kes)) : method === "pickup" ? "Free" : "To be confirmed";
  const payWhen = payPhrase(payMethod, method);

  // "Awaiting payment": confirmed but not paid. This is when the customer is told how to pay.
  // A "Pay now" customer can also pay straight after ordering, without waiting for our call.
  // M-Pesa and online customers pay straight after ordering; cash and pay-at-shop wait until we confirm.
  const payOnline = payMethod === "online" && pesapalOn;
  // An "online" order placed while Pesapal was on falls back to M-Pesa if it has since been switched off.
  const showMpesa = payMethod === "mpesa" || (payMethod === "online" && !pesapalOn);
  const awaitingPayment =
    !paid && status !== "cancelled" && status !== "completed" && (payMethod === "mpesa" || payMethod === "online" || status !== "pending");
  const payBlocker = payMethod === "online" ? payOnlineBlocker(order) : null;
  const latest = attempts?.[0];
  const hasAttempt = Boolean(latest);
  const reference = order.order_number;

  const next =
    status === "cancelled"
      ? null
      : paid && status === "pending"
        ? `We'll call you on ${formatPhone(order.customer_phone)} within ${confirmMinutes} minutes to confirm your order. Your payment is already in.`
        : status === "pending"
          ? showMpesa || payOnline
            ? `Pay using the details below. We'll also call you on ${formatPhone(order.customer_phone)} within ${confirmMinutes} minutes to confirm your order.`
            : `We'll call you on ${formatPhone(order.customer_phone)} within ${confirmMinutes} minutes to confirm your order. Then you pay ${payWhen}.`
          : status === "confirmed"
            ? paid
              ? "Your order is confirmed and paid. We'll get it ready for you."
              : "Your order is confirmed. See below how to pay."
            : status === "out_for_delivery"
              ? "Your order is on its way. Please keep your phone close in case the rider calls."
              : "Your order is complete. Thank you for shopping with us!";

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
        </p>
        <p className="text-xs text-muted">Keep this page&apos;s link to check your order later.</p>
      </section>

      {status !== "cancelled" && (
        <ol aria-label="Order progress" className="flex flex-wrap gap-y-3 border border-line p-6">
          {steps.map((step, i) => (
            <li key={step.label} aria-current={step.state === "current" ? "step" : undefined} className="flex flex-[1_1_140px] items-center gap-2.5 text-[13px]">
              <span className={`flex size-7 flex-none items-center justify-center rounded-full text-xs font-medium ${step.state !== "todo" ? "bg-brand text-white" : "bg-[#f2f4f8] text-muted"}`}>
                {step.state === "done" ? "✓" : i + 1}
              </span>
              <span className={step.state !== "todo" ? "font-medium" : "text-muted"}>{step.label}</span>
            </li>
          ))}
        </ol>
      )}

      {next && (
        <section className="flex flex-col gap-1.5 border border-line p-6">
          <h2 className="text-[15px] font-medium uppercase">What happens next</h2>
          <p className="text-sm text-body">{next}</p>
        </section>
      )}

      {awaitingPayment && (
        <section aria-labelledby="pay-h" className="flex flex-col gap-3 border-2 border-brand bg-tint p-6 text-sm">
          <h2 id="pay-h" className="text-[15px] font-medium uppercase">Awaiting payment</h2>
          {showMpesa && (
            !feeKnown ? (
              <p className="text-body">We&apos;re still working out your delivery fee. We&apos;ll tell you the final total, then you can pay.</p>
            ) : payTo ? (
              <>
                {payMethod === "online" && <p className="text-body">Online card payment isn&apos;t switched on yet, so please pay by M-Pesa.</p>}
                <p>
                  Pay <strong className="font-medium">{formatKes(order.total_kes)}</strong> by M-Pesa{[payTo.till, payTo.paybill, payTo.phone].filter(Boolean).length > 1 ? ", using any one of these" : ""}:
                </p>
                <ul className="flex flex-col gap-3">
                  {payTo.till && (
                    <li className="bg-white p-3.5">
                      <strong className="block font-medium">Buy Goods Till</strong>
                      <span className="text-body">M-Pesa, then <em>Lipa na M-Pesa</em>, <em>Buy Goods and Services</em>. Till number <strong className="font-medium text-text">{payTo.till}</strong>.</span>
                    </li>
                  )}
                  {payTo.paybill && (
                    <li className="bg-white p-3.5">
                      <strong className="block font-medium">Paybill</strong>
                      <span className="text-body">M-Pesa, then <em>Lipa na M-Pesa</em>, <em>Paybill</em>. Business number <strong className="font-medium text-text">{payTo.paybill}</strong>{payTo.account && <>, account number <strong className="font-medium text-text">{payTo.account}</strong></>}.</span>
                    </li>
                  )}
                  {payTo.phone && (
                    <li className="bg-white p-3.5">
                      <strong className="block font-medium">Send Money</strong>
                      <span className="text-body">M-Pesa, then <em>Send Money</em> to <strong className="font-medium text-text">{payTo.phone}</strong>.</span>
                    </li>
                  )}
                </ul>
                <p className="text-body">Enter the amount {formatKes(order.total_kes)} and your M-Pesa PIN. Your order number is <strong className="font-medium text-text">{reference}</strong>, in case you need to contact us about the payment.</p>
                <ClaimPaymentForm token={token} claimed={order.payment_claim_code} />
                <p className="text-body">We mark your order paid once we see the payment. This can take a few minutes during the day.</p>
              </>
            ) : (
              <p className="text-body">We&apos;ll give you our M-Pesa details when we call. Your order number is <strong className="font-medium text-text">{reference}</strong>.</p>
            )
          )}
          {payMethod === "cash" && (
            <p className="text-body">
              {method === "pickup" ? "Pay when you collect your order" : "Pay the rider when your order arrives"}: <strong className="font-medium text-text">{formatKes(order.total_kes)}</strong>, in cash or by M-Pesa.
            </p>
          )}
          {payMethod === "shop" && (
            <p className="text-body">Pay <strong className="font-medium text-text">{formatKes(order.total_kes)}</strong> at the shop when you collect your order.</p>
          )}
          {payMethod === "online" && (
            payOnline ? (
              <>
                {payBlocker ? (
                  <p className="text-body">{payBlocker}</p>
                ) : (
                  <>
                    {latest?.status === "failed" && <p role="alert" className="text-[#b42318]">Your last payment didn&apos;t go through. No money was taken. You can try again.</p>}
                    {latest?.status === "reversed" && <p role="alert" className="text-[#b42318]">Your last payment was reversed. You can try again.</p>}
                    {latest?.status === "pending" && (
                      <p className="text-body">We haven&apos;t received your payment yet. If you&apos;ve just paid, this page updates by itself within a minute. If you cancelled or closed the payment page, you can try again.</p>
                    )}
                    {!latest && <p className="text-body">Pay {formatKes(order.total_kes)} by M-Pesa or card, securely through Pesapal.</p>}
                    <PayButton token={token} label={hasAttempt ? "Try again" : `Pay ${formatKes(order.total_kes)}`} />
                  </>
                )}
              </>
            ) : null
          )}
        </section>
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
            <div className="flex justify-between gap-4">
              <span className="text-body">Delivery</span>
              <span>{feeText}</span>
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
            <p>{order.delivery_option_name ?? DELIVERY_METHODS[method].label}</p>
            <p className="text-body">Fee: {feeText}</p>
            {order.delivery_address && <p className="text-body">{order.delivery_address}</p>}
            {method === "pickup" &&
              (point ? (
                [point.address, point.hours].filter(Boolean).map((line) => <p key={line} className="text-body">{line}</p>)
              ) : !order.pickup_point_id ? (
                <p className="text-body">{settings.address ? `${settings.address}, Nairobi` : "Our Nairobi shop"}</p>
              ) : null)}
          </div>
          <div>
            <h2 className="mb-1.5 text-[15px] font-medium uppercase">Payment</h2>
            <p>{paymentTitle(payMethod, method)}</p>
            <p className="text-body">{PAYMENT_STATUSES[order.payment_status as PaymentStatus]}</p>
          </div>
          <div>
            <h2 className="mb-1.5 text-[15px] font-medium uppercase">Questions?</h2>
            <p className="text-body">Call us on {contact.phone}.</p>
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
    <main className="mx-auto w-full max-w-[1860px] flex-1 px-6 pt-[50px] pb-[90px] max-sm:px-4 max-sm:pt-6 max-sm:pb-14 lg:pl-[324px]">
      <Suspense fallback={<p className="text-muted">Loading your order…</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </main>
  );
}
