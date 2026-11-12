// Wording shared by checkout, the customer's order page and the dashboard.

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

export const PAYMENT_METHODS = {
  cash: "Pay on delivery or collection",
  mpesa: "M-Pesa",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

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
