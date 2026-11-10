import "server-only";
import { site } from "@/config/site";
import { DELIVERY_METHODS, formatPhone, type DeliveryMethod } from "@/lib/order-labels";
import { formatKes } from "@/lib/types";

// Every message here is best effort and never throws: the order is already saved and
// shows in the dashboard, so a failed email must not fail the customer's order.

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const siteUrl = () => (process.env.SITE_URL ?? "").replace(/\/$/, "");

/**
 * Sends an email through Mailgun. Does nothing until MAILGUN_API_KEY and MAILGUN_DOMAIN are
 * set. MAILGUN_FROM is the sender, e.g. "Sky254 Electronics <orders@mg.sky254.co.ke>", and
 * MAILGUN_REGION=eu uses Mailgun's EU servers for domains created there.
 */
async function sendEmail(to: string, subject: string, html: string, label: string) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return;
  const host = process.env.MAILGUN_REGION === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const body = new URLSearchParams({
    from: process.env.MAILGUN_FROM || `${site.name} <orders@${domain}>`,
    to,
    subject,
    html,
  });
  try {
    const response = await fetch(`https://${host}/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error(`${label} email failed: HTTP ${response.status}`);
  } catch {
    console.error(`${label} email failed`);
  }
}

// ---------- To the shop ----------

type OrderAlert = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  notes: string | null;
  subtotalKes: number;
  /** Taken off by a coupon. */
  discountKes?: number;
  couponCode?: string | null;
  /** null = to be confirmed by phone. */
  deliveryFeeKes: number | null;
  adminUrl: string;
  items: { name: string; qty: number; lineTotalKes: number }[];
};

/** Emails the shop about a new order. Does nothing until Mailgun (see sendEmail) and ORDER_ALERT_EMAIL are set. */
export async function sendOrderAlert(order: OrderAlert) {
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!to) return;

  const rows = order.items
    .map((item) => `<li>${item.qty} x ${escapeHtml(item.name)}: ${formatKes(item.lineTotalKes)}</li>`)
    .join("");
  const discount = order.discountKes ?? 0;
  const payable = order.subtotalKes - discount;
  const total =
    order.deliveryFeeKes == null
      ? `${discount ? "After coupon" : "Subtotal"}: ${formatKes(payable)}</strong> (delivery to be confirmed)`
      : `Total: ${formatKes(payable + order.deliveryFeeKes)}</strong> (delivery ${order.deliveryFeeKes ? formatKes(order.deliveryFeeKes) : "free"})`;
  const html = `
    <h2>New order ${escapeHtml(order.orderNumber)}</h2>
    <p><strong>${escapeHtml(order.customerName)}</strong>, ${escapeHtml(formatPhone(order.customerPhone))}</p>
    <p>${escapeHtml(DELIVERY_METHODS[order.deliveryMethod].label)}${order.deliveryAddress ? `: ${escapeHtml(order.deliveryAddress)}` : ""}</p>
    <ul>${rows}</ul>
    ${discount ? `<p>Coupon ${escapeHtml(order.couponCode ?? "")}: −${formatKes(discount)}</p>` : ""}
    <p><strong>${total}</p>
    ${order.notes ? `<p>Notes: ${escapeHtml(order.notes)}</p>` : ""}
    <p><a href="${escapeHtml(order.adminUrl)}">Open this order in the dashboard</a></p>`;

  await sendEmail(
    to,
    `New order ${order.orderNumber}: ${formatKes(payable + (order.deliveryFeeKes ?? 0))}`,
    html,
    `Order alert for ${order.orderNumber}`,
  );
}

/** Emails the shop about a message from the contact form. Same setup as sendOrderAlert. */
export async function sendEnquiryAlert(enquiry: {
  name: string;
  phone: string | null;
  email: string | null;
  topic: string;
  message: string;
  adminUrl: string;
}) {
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!to) return;
  const contact = [enquiry.phone && formatPhone(enquiry.phone), enquiry.email].filter(Boolean).join(" · ");
  const html = `
    <h2>New enquiry: ${escapeHtml(enquiry.topic)}</h2>
    <p><strong>${escapeHtml(enquiry.name)}</strong>, ${escapeHtml(contact)}</p>
    <p style="white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>
    <p><a href="${escapeHtml(enquiry.adminUrl)}">Open Enquiries in the dashboard</a></p>`;
  await sendEmail(to, `New enquiry from ${enquiry.name}`, html, "Enquiry alert");
}

// ---------- To the customer ----------

/**
 * The two moments a customer is emailed: when the order arrives, and when it's on its way.
 * Everything else they can follow on their order page or at /track-order.
 */
export type CustomerEmailEvent = "pending" | "out_for_delivery";

export type CustomerUpdate = {
  /** "pending" is a newly placed order. */
  event: CustomerEmailEvent;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalKes: number;
  /** False while the delivery fee is still to be confirmed. */
  deliveryConfirmed: boolean;
  /** The private link to the customer's order page. */
  token: string;
};

/** Emails the customer about their order, when they gave an email address at checkout. */
export async function sendCustomerUpdate(u: CustomerUpdate) {
  if (!u.customerEmail) return;
  const first = escapeHtml(u.customerName.split(" ")[0]);
  const number = escapeHtml(u.orderNumber);
  const total = `${formatKes(u.totalKes)}${u.deliveryConfirmed ? "" : " plus delivery"}`;
  const link = siteUrl() ? `${siteUrl()}/order/${u.token}` : null;
  const track = siteUrl() ? `${siteUrl()}/track-order` : null;

  const { subject, lines } =
    u.event === "pending"
      ? {
          subject: `We've received your order ${u.orderNumber}`,
          lines: [
            `Hi ${first},`,
            `Thank you for shopping with ${escapeHtml(site.name)}. We've received your order <strong>${number}</strong> (${total}).`,
            "We'll call you shortly to confirm it and arrange delivery or collection.",
          ],
        }
      : {
          subject: `Your order ${u.orderNumber} is on its way`,
          lines: [`Hi ${first},`, `Good news: your order <strong>${number}</strong> is on its way to you.`],
        };

  const html = `
    ${lines.map((line) => `<p>${line}</p>`).join("")}
    ${link ? `<p><a href="${escapeHtml(link)}">View your order</a></p>` : ""}
    ${track ? `<p>You can check its progress any time at <a href="${escapeHtml(track)}">${escapeHtml(track)}</a> with your order number and phone.</p>` : ""}
    <p>Questions? Call or WhatsApp us on ${escapeHtml(site.phone)}.</p>
    <p>${escapeHtml(site.name)}</p>`;

  await sendEmail(u.customerEmail, subject, html, `${u.event} email for ${u.orderNumber}`);
}
