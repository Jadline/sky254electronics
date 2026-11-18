import "server-only";
import { announce, orderTopic } from "@/lib/live";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Pesapal API 3.0: the customer pays on Pesapal's page (M-Pesa, Airtel Money or card), then
 * Pesapal sends them back to /pesapal/return and separately notifies /pesapal/ipn. Neither
 * carries the result, so both ask Pesapal for it (syncPayment) before anything is marked paid.
 *
 * Env, all server only: PESAPAL_ENV ("sandbox" or "live"), PESAPAL_CONSUMER_KEY,
 * PESAPAL_CONSUMER_SECRET, SITE_URL, and optionally PESAPAL_IPN_ID.
 */

const HOSTS = { sandbox: "https://cybqa.pesapal.com/pesapalv3", live: "https://pay.pesapal.com/v3" };
const base = () => (process.env.PESAPAL_ENV === "live" ? HOSTS.live : HOSTS.sandbox);
const siteUrl = () => (process.env.SITE_URL ?? "").replace(/\/$/, "");

/** True once the keys and the site's address are set. Until then the Pay button stays hidden. */
export function pesapalReady() {
  return Boolean(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET && siteUrl());
}

type PesapalErrorBody = { error_type?: string; type?: string; code?: string; message?: string } | null;

async function call<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown; auth?: boolean; allowError?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (options.auth !== false) headers.Authorization = `Bearer ${await accessToken()}`;
  const response = await fetch(`${base()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => null);
  const error = (data && !Array.isArray(data) ? data.error : null) as PesapalErrorBody;
  const failed = !response.ok || !data || (!options.allowError && error && (error.code || error.message));
  if (failed) throw new Error(`Pesapal ${path} failed: ${error?.message || error?.code || `HTTP ${response.status}`}`);
  return data as T;
}

// Tokens last up to 5 minutes. One is shared while it has at least a minute left.
let token: { value: string; expires: number } | null = null;

async function accessToken() {
  if (token && token.expires - Date.now() > 60_000) return token.value;
  const data = await call<{ token: string; expiryDate?: string }>("/api/Auth/RequestToken", {
    method: "POST",
    auth: false,
    body: { consumer_key: process.env.PESAPAL_CONSUMER_KEY, consumer_secret: process.env.PESAPAL_CONSUMER_SECRET },
  });
  if (!data.token) throw new Error("Pesapal sent no token");
  const stated = Date.parse(data.expiryDate ?? "");
  const latest = Date.now() + 5 * 60_000;
  token = { value: data.token, expires: Number.isFinite(stated) ? Math.min(stated, latest) : latest - 60_000 };
  return token.value;
}

// Pesapal needs the id of the registered notification (IPN) address with every payment.
let ipn: string | null = null;

/** PESAPAL_IPN_ID if set; otherwise finds this site's IPN address, registering it the first time. */
async function ipnId() {
  if (process.env.PESAPAL_IPN_ID) return process.env.PESAPAL_IPN_ID;
  if (ipn) return ipn;
  const url = `${siteUrl()}/pesapal/ipn`;
  const list = await call<{ url: string; ipn_id: string }[]>("/api/URLSetup/GetIpnList");
  const found = Array.isArray(list) ? list.find((entry) => entry.url === url) : undefined;
  ipn =
    found?.ipn_id ??
    (await call<{ ipn_id: string }>("/api/URLSetup/RegisterIPN", { method: "POST", body: { url, ipn_notification_type: "GET" } })).ipn_id;
  if (!ipn) throw new Error("Pesapal didn't register the IPN address");
  return ipn;
}

// Pesapal (tested on sandbox; its docs say otherwise) requires every name and address field, and
// allows only letters, digits and - _ . : in them, so no spaces. Names are cleaned to fit, and
// the address is the shop's city: the delivery address is kept on the order, not at Pesapal.
const pesapalText = (value: string) => value.normalize("NFD").replace(/[^A-Za-z0-9._:-]/g, "") || ".";

function billingAddress(input: { customerName: string; phone: string; email: string | null }) {
  const names = input.customerName.split(/\s+/).map(pesapalText).filter((name) => name !== ".");
  const [first = "Customer", ...rest] = names;
  return {
    phone_number: `0${input.phone.slice(3)}`,
    ...(input.email && { email_address: input.email }),
    country_code: "KE",
    first_name: first,
    middle_name: rest.length > 1 ? rest[0] : ".",
    last_name: (rest.length > 1 ? rest.slice(1) : rest).join("-") || ".",
    line_1: "Nairobi",
    line_2: ".",
    city: "Nairobi",
    state: "Nairobi",
    postal_code: "00100",
  };
}

/** Creates the payment at Pesapal and returns where to send the customer. */
export async function submitPayment(input: {
  reference: string;
  amountKes: number;
  description: string;
  customerName: string;
  /** 2547XXXXXXXX */
  phone: string;
  email: string | null;
}) {
  const data = await call<{ order_tracking_id: string; redirect_url: string }>("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    body: {
      id: input.reference,
      currency: "KES",
      amount: input.amountKes,
      description: input.description.slice(0, 100),
      callback_url: `${siteUrl()}/pesapal/return`,
      // Pesapal adds nothing to this link, so it names the payment itself.
      cancellation_url: `${siteUrl()}/pesapal/return?ref=${encodeURIComponent(input.reference)}`,
      notification_id: await ipnId(),
      billing_address: billingAddress(input),
    },
  });
  if (!data.order_tracking_id || !data.redirect_url) throw new Error("Pesapal sent no payment page");
  return { trackingId: data.order_tracking_id, redirectUrl: data.redirect_url };
}

type TransactionStatus = {
  status_code?: number | null;
  payment_status_description?: string | null;
  payment_method?: string | null;
  payment_account?: string | null;
  confirmation_code?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  merchant_reference?: string | null;
  error?: PesapalErrorBody;
};

// Pesapal's status_code: 1 completed, 2 failed, 3 reversed. 0 ("invalid") means not paid yet.
const STATUS: Record<number, "paid" | "failed" | "reversed"> = { 1: "paid", 2: "failed", 3: "reversed" };

/**
 * Asks Pesapal how a payment stands and saves it, then settles the order. Returns the
 * order's id, or null when the payment isn't one of ours. Throws when Pesapal can't be reached.
 */
export async function syncPayment(trackingId: string) {
  const db = createAdminClient();
  const { data: payment } = await db
    .from("pesapal_payments")
    .select("id, order_id, merchant_reference, status, paid_kes, confirmation_code")
    .eq("order_tracking_id", trackingId)
    .maybeSingle();
  if (!payment) return null;

  // Before a customer pays, Pesapal answers with an error as well as status 0.
  const tx = await call<TransactionStatus>(`/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`, {
    allowError: true,
  });
  if (tx.merchant_reference && tx.merchant_reference !== payment.merchant_reference) {
    throw new Error(`Pesapal payment ${trackingId} belongs to ${tx.merchant_reference}, not ${payment.merchant_reference}`);
  }
  const status = STATUS[Number(tx.status_code)] ?? "pending";
  // Only shillings count towards the order.
  const amount = Math.floor(Number(tx.amount));
  const paidKes = status === "paid" && tx.currency === "KES" && Number.isFinite(amount) ? amount : null;
  const changes = {
    status,
    paid_kes: paidKes,
    status_description: tx.payment_status_description || tx.error?.message || null,
    pay_method: tx.payment_method || null,
    pay_account: tx.payment_account || null,
    confirmation_code: tx.confirmation_code || null,
  };
  const unchanged = payment.status === status && payment.paid_kes === paidKes && payment.confirmation_code === changes.confirmation_code;
  if (unchanged) return payment.order_id as string;

  const { error } = await db.from("pesapal_payments").update(changes).eq("id", payment.id);
  if (error) throw new Error(`Couldn't save Pesapal payment ${trackingId}: ${error.message}`);
  await settleOrder(payment.order_id);
  return payment.order_id as string;
}

/**
 * Sets the order's payment status from its Pesapal payments: paid once they cover the
 * total; failed when the latest attempt failed. An order the shop marked paid by hand
 * stays paid unless a Pesapal payment on it was reversed.
 */
export async function settleOrder(orderId: string) {
  const db = createAdminClient();
  const [{ data: order }, { data: payments }] = await Promise.all([
    db.from("orders").select("payment_status, total_kes").eq("id", orderId).maybeSingle(),
    db.from("pesapal_payments").select("status, paid_kes").eq("order_id", orderId).order("created_at", { ascending: false }),
  ]);
  if (!order || !payments) return;

  const paidKes = payments.reduce((sum, p) => sum + (p.status === "paid" ? (p.paid_kes ?? 0) : 0), 0);
  let next = order.payment_status as string;
  if (paidKes >= order.total_kes) next = "paid";
  else if (payments.some((p) => p.status === "paid" || p.status === "reversed")) next = "unpaid";
  else if (payments[0]?.status === "failed" && next !== "paid") next = "failed";

  if (next !== order.payment_status) await db.from("orders").update({ payment_status: next }).eq("id", orderId);
  // The customer's open order page updates at once; the dashboard refreshes on its own.
  announce(orderTopic(orderId));
}
