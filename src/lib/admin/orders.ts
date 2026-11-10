/**
 * How the admin reads orders: status and payment labels with their colours.
 * Plain values, so server pages and client components can both use them.
 */
import type { Tone } from "@/components/admin/ui";
import { ORDER_STATUSES, type DeliveryMethod, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/lib/order-labels";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone; color: string }> = {
  pending: { label: "New", tone: "amber", color: "#f0a020" },
  confirmed: { label: ORDER_STATUSES.confirmed, tone: "indigo", color: "#5b4fa8" },
  out_for_delivery: { label: ORDER_STATUSES.out_for_delivery, tone: "teal", color: "#0f9488" },
  completed: { label: ORDER_STATUSES.completed, tone: "green", color: "#0669d6" },
  cancelled: { label: ORDER_STATUSES.cancelled, tone: "gray", color: "#8090a3" },
};
export const STATUS_ORDER = Object.keys(ORDER_STATUS) as OrderStatus[];

/** The next step for an order, offered as a one-click action. */
export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Confirm order" },
  confirmed: { status: "out_for_delivery", label: "Mark out for delivery" },
  out_for_delivery: { status: "completed", label: "Mark completed" },
};
/** Pickups skip "out for delivery": once confirmed, the next step is collection. */
export function nextStatus(status: OrderStatus, delivery: DeliveryMethod) {
  if (delivery === "pickup" && status === "confirmed") return { status: "completed" as const, label: "Mark collected" };
  return NEXT_STATUS[status];
}

export type PaymentState = "paid" | "pending" | "failed" | "due" | "unpaid";

/** Paid; an M-Pesa prompt in progress; failed; cash due on delivery; or not paid. */
export function paymentState(o: { payment_method: string; payment_status: string }): PaymentState {
  if (o.payment_status === "paid") return "paid";
  if (o.payment_status === "pending") return "pending";
  if (o.payment_status === "failed") return "failed";
  return o.payment_method === "cash" ? "due" : "unpaid";
}

export const PAYMENT_STATE: Record<PaymentState, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "green" },
  pending: { label: "In progress", tone: "amber" },
  failed: { label: "Failed", tone: "red" },
  due: { label: "Due on delivery", tone: "indigo" },
  unpaid: { label: "Not paid", tone: "red" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = { mpesa: "M-Pesa", cash: "Cash on delivery" };

export const DELIVERY: Record<DeliveryMethod, { label: string; short: string; color: string }> = {
  nairobi: { label: "Delivery within Nairobi", short: "Nairobi", color: "#0669d6" },
  countrywide: { label: "Countrywide courier", short: "Countrywide", color: "#5b4fa8" },
  pickup: { label: "Pick up from the shop", short: "Pickup", color: "#f0643c" },
};

export type { OrderStatus, PaymentStatus, PaymentMethod, DeliveryMethod };

/** A phone number as 0712 345 678. Orders store 2547XXXXXXXX. */
export function prettyPhone(phone: string) {
  const local = phone.startsWith("254") ? `0${phone.slice(3)}` : phone;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/** A wa.me link that opens a WhatsApp chat with the customer. */
export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** A delivery order still waiting for its fee: the customer can't see a final total yet. */
export const needsFee = (o: { delivery_method: string; delivery_fee_kes: number | null; status: string }) =>
  o.delivery_method !== "pickup" && o.delivery_fee_kes == null && o.status !== "cancelled" && o.status !== "completed";
