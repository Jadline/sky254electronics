// Wording shared by checkout, the customer's order page and the dashboard.

import { PAYMENT_CHOICES } from "@/lib/payment-options";

/**
 * The kind of delivery an order has. The option's own name (from Delivery in the
 * dashboard) is stored on the order too; these labels are for orders without one.
 */
export const DELIVERY_METHODS = {
  nairobi: { label: "Delivery by our rider", needsAddress: true },
  countrywide: { label: "Courier", needsAddress: true },
  pickup: { label: "Pickup", needsAddress: false },
} as const;
export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

export const ORDER_STATUSES = {
  pending: "Order received",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const PAYMENT_STATUSES = {
  unpaid: "Not paid yet",
  pending: "Payment in progress",
  paid: "Paid",
  failed: "Payment failed",
} as const;
export type PaymentStatus = keyof typeof PAYMENT_STATUSES;

/**
 * The payment the customer chose at checkout (orders.payment_method): M-Pesa after we confirm,
 * pay on delivery, pay at the shop, or "Pay now" through Pesapal (only while it's switched on).
 */
export const PAYMENT_METHODS = {
  mpesa: PAYMENT_CHOICES.mpesa.title,
  cash: PAYMENT_CHOICES.cash.title,
  shop: PAYMENT_CHOICES.shop.title,
  online: PAYMENT_CHOICES.online.title,
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/** How customers can pay online, in the words they'll recognise. */
export const ONLINE_PAY_WAYS = "M-Pesa, Airtel Money or card";

/**
 * Why an order can't be paid through Pesapal yet, or null when it can. Only orders where the customer
 * chose "Pay now" are paid this way. They can pay as soon as the total is final, without waiting for
 * our call, so a delivery order still waiting on its fee has to wait for it.
 */
export function payOnlineBlocker(o: { payment_method: string; status: string; payment_status: string; delivery_method: string; delivery_fee_kes: number | null }) {
  if (o.payment_method !== "online") return "This order isn't set up to pay online.";
  if (o.payment_status === "paid") return "This order is already paid.";
  if (o.status === "cancelled") return "This order was cancelled.";
  if (o.status === "completed") return "This order is already completed. Please call us about payment.";
  if (o.delivery_method !== "pickup" && o.delivery_fee_kes == null) {
    return "We're still working out your delivery fee. You can pay here once it's set.";
  }
  return null;
}

/** Kenyan mobile numbers, stored as 2547XXXXXXXX or 2541XXXXXXXX. */
export function normalisePhone(raw: string) {
  const digits = raw.replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (/^0[17]\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^[17]\d{8}$/.test(digits)) return "254" + digits;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return null;
}

export function formatPhone(phone: string) {
  return phone.startsWith("254") ? "0" + phone.slice(3) : phone;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(iso));
}
