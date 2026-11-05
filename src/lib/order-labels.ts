// Wording shared by checkout, the customer's order page and the dashboard.

export const DELIVERY_METHODS = {
  nairobi: { label: "Delivery within Nairobi", hint: "We'll call to confirm the time and fee.", needsAddress: true },
  countrywide: { label: "Countrywide courier", hint: "We'll call to confirm the courier and fee.", needsAddress: true },
  pickup: { label: "Pick up from our shop", hint: "We'll call when it's ready to collect.", needsAddress: false },
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

export const PAYMENT_METHODS = {
  cash: "Pay on delivery or collection",
  mpesa: "M-Pesa",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

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
