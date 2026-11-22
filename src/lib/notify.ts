import "server-only";
import { site } from "@/config/site";
import { formatPhone } from "@/lib/order-labels";
import { describePayTo } from "@/lib/payment-options";
import { confirmMinutes, mpesaPayTo } from "@/lib/shop-payment";
import { createAdminClient } from "@/lib/supabase/admin";
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
    text: toText(html),
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

// ---------- Shared look ----------

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = "#0b1b33";
const BODY = "#3b4a5e";
const MUTED = "#5b6b80";
const BRAND = "#0669d6";
const LINE = "#e3e8ef";
const SURFACE = "#f4f7fb";

/** A plain-text copy of the email for mail apps that don't show HTML. */
function toText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/gi, "")
    .replace(/<\/td>/gi, "  ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|h1|h2|tr|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&minus;/g, "-")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td align="center" bgcolor="${BRAND}" style="border-radius:999px;background:${BRAND};">
      <a href="${escapeHtml(href)}" style="display:block;padding:15px 24px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr></table>`;
}

/** The shop's number and M-Pesa details from Shop settings (the built-in number if none is saved). */
async function shopDetails() {
  try {
    const { data } = await createAdminClient()
      .from("shop_settings")
      .select("phone, mpesa_till, mpesa_paybill, mpesa_paybill_account, mpesa_phone")
      .eq("id", 1)
      .maybeSingle();
    return {
      phone: (data?.phone as string | null)?.trim() || site.phone,
      payTo: mpesaPayTo({ mpesaTill: data?.mpesa_till ?? null, mpesaPaybill: data?.mpesa_paybill ?? null, mpesaPaybillAccount: data?.mpesa_paybill_account ?? null, mpesaPhone: data?.mpesa_phone ?? null }),
    };
  } catch {
    return { phone: site.phone, payTo: mpesaPayTo(null) };
  }
}
async function contactPhone() {
  return (await shopDetails()).phone;
}

/** The wrapper every email shares: wordmark, white card with a blue strip, footer. */
function layout({ preheader, badge, title, content, shopPhone }: { preheader: string; badge: string; title: string; content: string; shopPhone: string }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};"><tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px 4px;font-family:${FONT};">
      <span style="font-size:22px;font-weight:700;letter-spacing:-0.4px;color:${INK};">Sky<span style="color:${BRAND};">254</span></span>
      <span style="font-size:11px;font-weight:600;letter-spacing:0.8px;color:${MUTED};padding-left:8px;">${escapeHtml(badge)}</span>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="6" style="height:6px;line-height:6px;font-size:0;background:${BRAND};border-radius:20px 20px 0 0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 32px 32px;font-family:${FONT};color:${BODY};font-size:15px;line-height:1.6;">
          <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:${INK};">${title}</h1>
          ${content}
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:#8090a3;">
      ${escapeHtml(site.name)} &middot; ${escapeHtml(shopPhone)}<br />This is an automated message.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** A label and value on one row, for the summary boxes. */
const row = (label: string, value: string, strong = false) =>
  `<tr><td style="padding:5px 0;font-size:14px;color:${MUTED};">${label}</td><td align="right" style="padding:5px 0;font-size:14px;color:${INK};${strong ? "font-weight:700;font-size:16px;" : ""}">${value}</td></tr>`;

const box = (inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};border-radius:12px;margin:0 0 20px 0;"><tr><td style="padding:14px 16px;">${inner}</td></tr></table>`;

// ---------- To the shop ----------

type OrderAlert = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  /** The delivery option or pickup point chosen. */
  deliveryName: string;
  deliveryAddress: string | null;
  notes: string | null;
  subtotalKes: number;
  /** null = to be confirmed by phone. */
  deliveryFeeKes: number | null;
  adminUrl: string;
  items: { name: string; qty: number; lineTotalKes: number }[];
};

/** Emails the shop about a new order. Does nothing until Mailgun (see sendEmail) and ORDER_ALERT_EMAIL are set. */
export async function sendOrderAlert(order: OrderAlert) {
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!to) return;
  const shopPhone = await contactPhone();

  const payable = order.subtotalKes;
  const phone = formatPhone(order.customerPhone);

  const items = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};">${escapeHtml(item.name)}<br /><span style="color:${MUTED};font-size:13px;">Qty ${item.qty}</span></td>
        <td align="right" valign="top" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};white-space:nowrap;">${formatKes(item.lineTotalKes)}</td>
      </tr>`,
    )
    .join("");

  const totals = [
    row("Subtotal", formatKes(order.subtotalKes)),
    row("Delivery", order.deliveryFeeKes == null ? "To be confirmed" : order.deliveryFeeKes ? formatKes(order.deliveryFeeKes) : "Free"),
    row("Total", order.deliveryFeeKes == null ? `${formatKes(payable)} + delivery` : formatKes(payable + order.deliveryFeeKes), true),
  ].join("");

  const content = `
    <p style="margin:0 0 20px 0;">A customer just placed an order on the shop.</p>
    ${box(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Customer", `<strong>${escapeHtml(order.customerName)}</strong>`)}
      ${row("Phone", `<a href="tel:${escapeHtml(order.customerPhone)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(phone)}</a>`)}
      ${row(escapeHtml(order.deliveryName), order.deliveryAddress ? escapeHtml(order.deliveryAddress) : "")}
    </table>`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">${items}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">${totals}</table>
    ${order.notes ? box(`<span style="font-size:12px;font-weight:600;letter-spacing:0.6px;color:${MUTED};">CUSTOMER NOTES</span><br /><span style="font-size:14px;color:${INK};white-space:pre-wrap;">${escapeHtml(order.notes)}</span>`) : ""}
    ${button("Open this order in the dashboard", order.adminUrl)}
    <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};">Call the customer to confirm, then mark the order Confirmed so they get their payment details.</p>`;

  await sendEmail(
    to,
    `New order ${order.orderNumber}: ${formatKes(payable + (order.deliveryFeeKes ?? 0))}`,
    layout({
      preheader: `${order.customerName} ordered ${formatKes(payable + (order.deliveryFeeKes ?? 0))}`,
      shopPhone,
      badge: "NEW ORDER",
      title: `New order ${escapeHtml(order.orderNumber)}`,
      content,
    }),
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
  const content = `
    ${box(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("From", `<strong>${escapeHtml(enquiry.name)}</strong>`)}
      ${row("Contact", escapeHtml(contact) || "None given")}
      ${row("Topic", escapeHtml(enquiry.topic))}
    </table>`)}
    <p style="margin:0 0 20px 0;white-space:pre-wrap;color:${INK};">${escapeHtml(enquiry.message)}</p>
    ${button("Open Enquiries in the dashboard", enquiry.adminUrl)}`;
  await sendEmail(
    to,
    `New enquiry from ${enquiry.name}`,
    layout({ shopPhone: await contactPhone(), preheader: enquiry.message.slice(0, 90), badge: "NEW ENQUIRY", title: `New enquiry: ${escapeHtml(enquiry.topic)}`, content }),
    "Enquiry alert",
  );
}

// ---------- To the customer ----------

/**
 * The moments a customer is emailed: when the order arrives, when the shop confirms it (with
 * how to pay), and when it's on its way. The rest shows on their order page and at /track-order.
 */
export type CustomerEmailEvent = "pending" | "confirmed" | "out_for_delivery";

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
  /** What they chose at checkout: "mpesa", "cash", "shop" or "online", and how it's delivered. */
  paymentMethod: string;
  deliveryMethod: string;
  /** For "Pay now" orders: whether they can pay online yet. */
  payOnline?: boolean;
};

/** The three steps shown under every customer email, with the current one filled in. */
function progress(current: number) {
  const steps = ["Received", "Confirmed", "On its way"];
  const cells = steps
    .map((label, i) => {
      const done = i <= current;
      return `<td align="center" width="33%" style="font-family:${FONT};">
        <div style="height:6px;border-radius:999px;background:${done ? BRAND : LINE};"></div>
        <div style="padding-top:8px;font-size:12px;font-weight:${i === current ? 700 : 500};color:${done ? INK : "#8090a3"};">${label}</div>
      </td>`;
    })
    .join('<td width="8" style="width:8px;"></td>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;"><tr>${cells}</tr></table>`;
}

/** Emails the customer about their order, when they gave an email address at checkout. */
export async function sendCustomerUpdate(u: CustomerUpdate) {
  if (!u.customerEmail) return;
  const { phone: shopPhone, payTo: shopPayTo } = await shopDetails();
  const first = escapeHtml(u.customerName.split(" ")[0]);
  const number = escapeHtml(u.orderNumber);
  const total = `${formatKes(u.totalKes)}${u.deliveryConfirmed ? "" : " plus delivery"}`;
  const link = siteUrl() ? `${siteUrl()}/order/${u.token}` : null;
  const track = siteUrl() ? `${siteUrl()}/track-order` : null;

  const pickup = u.deliveryMethod === "pickup";
  // How they said they'd pay, in a few words, and what to do once the order is confirmed.
  const phrase =
    u.paymentMethod === "mpesa"
      ? "by M-Pesa"
      : u.paymentMethod === "shop"
        ? "at the shop when you collect"
        : u.paymentMethod === "online"
          ? "online, by M-Pesa or card"
          : pickup
            ? "in cash or M-Pesa when you collect"
            : "in cash or M-Pesa on delivery";
  const payTo = describePayTo(shopPayTo);
  const pay =
    u.paymentMethod === "mpesa"
      ? payTo
        ? `Please pay ${formatKes(u.totalKes)}${u.deliveryConfirmed ? "" : " plus delivery"} by M-Pesa: ${payTo}. Then enter your M-Pesa code on your order page. Your order number is ${u.orderNumber}.`
        : "We'll give you our M-Pesa details on the call. Your order number is the reference."
      : u.paymentMethod === "shop"
        ? "You pay at the shop when you collect your order."
        : u.paymentMethod === "online"
          ? u.payOnline
            ? `You can pay ${formatKes(u.totalKes)} now by M-Pesa or card from your order page.`
            : "We'll tell you when you can pay online."
          : pickup
            ? "You pay in cash or by M-Pesa when you collect your order."
            : "You pay the rider in cash or by M-Pesa when your order arrives.";

  const copy =
    u.event === "pending"
      ? {
          step: 0,
          subject: `We've received your order ${u.orderNumber}`,
          title: "We've got your order",
          intro: `Thank you for shopping with ${escapeHtml(site.name)}. We'll call you within ${confirmMinutes()} minutes to confirm it. ${u.paymentMethod === "mpesa" ? "You can pay by M-Pesa straight away, as shown below." : `Then you pay ${phrase}.`}`,
          cta: "View your order",
        }
      : u.event === "confirmed"
        ? {
            step: 1,
            subject: u.paymentMethod === "online" && u.payOnline ? `Your order ${u.orderNumber} is confirmed: pay online` : `Your order ${u.orderNumber} is confirmed`,
            title: "Your order is confirmed",
            intro: escapeHtml(pay),
            cta: u.paymentMethod === "online" && u.payOnline ? "Pay and view your order" : "View your order",
          }
        : {
            step: 2,
            subject: `Your order ${u.orderNumber} is on its way`,
            title: "Your order is on its way",
            intro: "Good news: it's on its way to you. Please keep your phone close in case the rider calls.",
            cta: "View your order",
          };

  const content = `
    <p style="margin:0 0 20px 0;">Hi ${first},</p>
    <p style="margin:0 0 24px 0;">${copy.intro}</p>
    ${progress(copy.step)}
    ${box(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Order number", `<strong>${number}</strong>`)}
      ${row("Total", total, true)}
    </table>`)}
    ${link ? button(copy.cta, link) : ""}
    ${track ? `<p style="margin:20px 0 0 0;font-size:13px;color:${MUTED};">Check progress any time at <a href="${escapeHtml(track)}" style="color:${BRAND};">${escapeHtml(track)}</a> with your order number and phone.</p>` : ""}
    <p style="margin:20px 0 0 0;font-size:14px;">Questions? Call or WhatsApp us on <a href="tel:${escapeHtml(shopPhone.replace(/[^\d+]/g, ""))}" style="color:${BRAND};text-decoration:none;font-weight:600;">${escapeHtml(shopPhone)}</a>.</p>
    <p style="margin:16px 0 0 0;font-size:14px;color:${INK};">${escapeHtml(site.name)}</p>`;

  await sendEmail(
    u.customerEmail,
    copy.subject,
    layout({ shopPhone, preheader: `Order ${u.orderNumber}: ${total}`, badge: "ORDER UPDATE", title: copy.title, content }),
    `${u.event} email for ${u.orderNumber}`,
  );
}
