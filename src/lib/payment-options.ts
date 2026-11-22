// The payment choices at checkout, and how they're described to customers and the shop.
// Plain values and functions only, so checkout (browser) and the server can share them.

import type { DeliveryChoice } from "@/lib/delivery";

/** What the customer chose, as stored in orders.payment_method. */
export const PAYMENT_CHOICES = {
  mpesa: { title: "Pay with M-Pesa", short: "M-Pesa" },
  cash: { title: "Pay on delivery (our own rider only)", short: "Pay on delivery" },
  shop: { title: "Pay at the shop", short: "Pay at the shop" },
  online: { title: "Pay now (M-Pesa / card)", short: "Pay now online" },
} as const;
export type PaymentChoice = keyof typeof PAYMENT_CHOICES;

/** The order they're shown in. */
const ORDER: PaymentChoice[] = ["mpesa", "cash", "shop", "online"];

/**
 * Which payment choices a delivery choice allows:
 * - M-Pesa after confirmation: always.
 * - Pay on delivery: only the shop's own rider (Nairobi), and pickup.
 * - Pay at the shop: pickup only.
 * - Pay now: only while Pesapal is switched on (PESAPAL_ENABLED).
 */
export function paymentOptions(choice: DeliveryChoice | null, pesapalOn: boolean): PaymentChoice[] {
  if (!choice) return [];
  const pickup = choice.kind === "pickup";
  const ownRider = choice.kind === "option" && choice.option.ownRider;
  return ORDER.filter((m) => {
    if (m === "cash") return pickup || ownRider;
    if (m === "shop") return pickup;
    if (m === "online") return pesapalOn;
    return true;
  });
}

/** A payment choice in words, for an order. Cash on a pickup order is "on collection". */
export function paymentTitle(method: string, deliveryMethod: string) {
  if (method === "cash" && deliveryMethod === "pickup") return "Pay on collection (cash or M-Pesa)";
  return PAYMENT_CHOICES[method as PaymentChoice]?.title ?? method;
}
export function paymentShort(method: string, deliveryMethod: string) {
  if (method === "cash" && deliveryMethod === "pickup") return "Pay on collection";
  return PAYMENT_CHOICES[method as PaymentChoice]?.short ?? method;
}

/** Where the shop receives M-Pesa payments. Any of the three can be set, or all of them; null if none. */
export type MpesaPayTo = { till: string | null; paybill: string | null; account: string | null; phone: string | null } | null;

/** "Buy Goods Till number 123456, or Paybill 123456 (account number X), or Send Money to 0712 345 678". */
export function describePayTo(payTo: MpesaPayTo) {
  if (!payTo) return null;
  const ways = [
    payTo.till && `Buy Goods Till number ${payTo.till}`,
    payTo.paybill && `Paybill ${payTo.paybill}${payTo.account ? ` (account number ${payTo.account})` : ""}`,
    payTo.phone && `Send Money to ${payTo.phone}`,
  ].filter(Boolean);
  return ways.length ? ways.join(", or ") : null;
}

/** Shop details for the payment wording, passed from the server. */
export type PaymentInfo = { payTo: MpesaPayTo; confirmMinutes: number; pesapalOn: boolean };

/** One step of the progress bar on the order page. */
export type TrackStep = { label: string; state: "done" | "current" | "todo" };

/**
 * Received → Confirmed → Awaiting payment → Paid → Dispatched → Delivered. It's worked out from the
 * order's status and payment status, so there's no separate field to keep in step. A pickup order has
 * no "Dispatched": it goes straight from Paid to Collected.
 */
export function trackingSteps(o: { status: string; payment_status: string; delivery_method: string }): TrackStep[] {
  const pickup = o.delivery_method === "pickup";
  const labels = pickup
    ? ["Received", "Confirmed", "Awaiting payment", "Paid", "Collected"]
    : ["Received", "Confirmed", "Awaiting payment", "Paid", "Dispatched", "Delivered"];
  const last = labels.length - 1;
  const paid = o.payment_status === "paid";

  let reached = 0; // the step the order is on
  if (o.status === "confirmed") reached = paid ? 3 : 2;
  else if (o.status === "out_for_delivery") reached = pickup ? 3 : 4;
  else if (o.status === "completed") reached = last;

  return labels.map((label, i) => {
    // Paid can still be ahead of an order that's already on its way: the customer pays on delivery.
    if (i === 3) return { label, state: paid ? "done" : reached > 3 ? "todo" : reached === 3 ? "current" : "todo" };
    if (i === reached) return { label, state: i === last ? "done" : "current" };
    return { label, state: i < reached ? "done" : "todo" };
  });
}
