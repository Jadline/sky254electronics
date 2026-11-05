import "server-only";
import { DELIVERY_METHODS, formatPhone, type DeliveryMethod } from "@/lib/order-labels";
import { formatKes } from "@/lib/types";

type OrderAlert = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  notes: string | null;
  subtotalKes: number;
  adminUrl: string;
  items: { name: string; qty: number; lineTotalKes: number }[];
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the shop about a new order through Resend. Does nothing until
 * RESEND_API_KEY and ORDER_ALERT_EMAIL are set. Never throws: a failed alert must
 * not fail the customer's order, which is already saved and shows in the dashboard.
 */
export async function sendOrderAlert(order: OrderAlert) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!apiKey || !to) return;

  const rows = order.items
    .map((item) => `<li>${item.qty} x ${escapeHtml(item.name)}: ${formatKes(item.lineTotalKes)}</li>`)
    .join("");
  const html = `
    <h2>New order ${escapeHtml(order.orderNumber)}</h2>
    <p><strong>${escapeHtml(order.customerName)}</strong>, ${escapeHtml(formatPhone(order.customerPhone))}</p>
    <p>${escapeHtml(DELIVERY_METHODS[order.deliveryMethod].label)}${order.deliveryAddress ? `: ${escapeHtml(order.deliveryAddress)}` : ""}</p>
    <ul>${rows}</ul>
    <p><strong>Subtotal: ${formatKes(order.subtotalKes)}</strong> (delivery to be confirmed)</p>
    ${order.notes ? `<p>Notes: ${escapeHtml(order.notes)}</p>` : ""}
    <p><a href="${escapeHtml(order.adminUrl)}">Open this order in the dashboard</a></p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_ALERT_FROM || "Sky254 Orders <onboarding@resend.dev>",
        to: [to],
        subject: `New order ${order.orderNumber}: ${formatKes(order.subtotalKes)}`,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error(`Order alert failed for ${order.orderNumber}: HTTP ${response.status}`);
  } catch {
    console.error(`Order alert failed for ${order.orderNumber}`);
  }
}
