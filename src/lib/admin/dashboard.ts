import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DELIVERY, ORDER_STATUS, STATUS_ORDER, needsFee, type DeliveryMethod, type OrderStatus } from "@/lib/admin/orders";

export const RANGES = {
  "30d": { name: "Last 30 days", label: "the last 30 days", days: 30 },
  "90d": { name: "Last 3 months", label: "the last 3 months", days: 91 },
  "12m": { name: "Last 12 months", label: "the last 12 months", days: 365 },
} as const;
export type RangeKey = keyof typeof RANGES;

/** New orders still unconfirmed after this many days are called out on the dashboard. */
export const STALE_DAYS = 2;

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Africa/Nairobi" });
/** "2026-03" in Nairobi time (UTC+3 all year). */
const monthKey = (d: Date) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 7);

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  payment_method: "mpesa" | "cash";
  payment_status: string;
  customer_phone: string;
  delivery_method: DeliveryMethod;
  delivery_fee_kes: number | null;
  total_kes: number;
  order_items: { product_id: string | null; product_name: string; qty: number; line_total_kes: number }[];
};

export type LatestOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  created_at: string;
  status: OrderStatus;
  payment_method: "mpesa" | "cash";
  payment_status: string;
  total_kes: number;
};

const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`Couldn't load ${what}: ${error.message}`);
};

/**
 * Everything the dashboard shows, counted from the database on each visit. The shop has a
 * few hundred orders a year at most, so a year of them is read once and added up here.
 */
export async function loadDashboard(supabase: SupabaseClient, range: RangeKey) {
  const now = new Date();
  // The chart starts on the 1st of the month 11 months ago, Nairobi time. "Last 12 months"
  // uses the same start, so the figures and the chart always add up to the same total.
  const chartStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1) - 3 * 3600_000);
  const since = range === "12m" ? chartStart : new Date(now.getTime() - RANGES[range].days * 86_400_000);
  const from = since < chartStart ? since : chartStart;
  const stale = new Date(now.getTime() - STALE_DAYS * 86_400_000);
  const head = { count: "exact" as const, head: true };

  const [orders, open, failed, staleNew, products, latest] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, created_at, status, payment_method, payment_status, customer_phone, delivery_method, delivery_fee_kes, total_kes, order_items(product_id, product_name, qty, line_total_kes)",
      )
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    // All time: the to-do list is about every order still open, whatever the range.
    supabase.from("orders").select("status, delivery_method, delivery_fee_kes").in("status", ["pending", "confirmed", "out_for_delivery"]),
    supabase.from("orders").select("id", head).eq("payment_status", "failed").neq("status", "cancelled"),
    supabase.from("orders").select("id", head).eq("status", "pending").lt("created_at", stale.toISOString()),
    supabase.from("products").select("in_stock, is_active, price_kes, product_images(kind)"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, created_at, status, payment_method, payment_status, total_kes")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  fail("orders", orders.error);
  fail("open orders", open.error);
  fail("products", products.error);
  fail("latest orders", latest.error);

  const all = (orders.data ?? []) as unknown as OrderRow[];
  const live = all.filter((o) => o.status !== "cancelled");
  const allInRange = all.filter((o) => new Date(o.created_at) >= since);
  const inRange = live.filter((o) => new Date(o.created_at) >= since);
  const ordered = inRange.reduce((t, o) => t + o.total_kes, 0);
  const paid = inRange.filter((o) => o.payment_status === "paid").reduce((t, o) => t + o.total_kes, 0);

  const phones = inRange.map((o) => o.customer_phone);
  const customers = new Set(phones).size;
  const returning = [...new Set(phones)].filter((p) => phones.indexOf(p) !== phones.lastIndexOf(p)).length;

  // Sales by month: the last 12 months, oldest first.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 15));
    return { key: monthKey(d), short: SHORT_MONTHS[d.getUTCMonth()], long: MONTH_LONG.format(d), ordered: 0, paid: 0 };
  });
  for (const o of live) {
    const m = months.find((x) => x.key === monthKey(new Date(o.created_at)));
    if (!m) continue;
    m.ordered += o.total_kes;
    if (o.payment_status === "paid") m.paid += o.total_kes;
  }
  const best = months.reduce((a, b) => (b.ordered > a.ordered ? b : a), months[0]);

  // Where the range's orders stand, cancelled included, so every order is in one slice.
  const statuses = STATUS_ORDER.map((key) => ({
    key,
    label: ORDER_STATUS[key].label,
    color: ORDER_STATUS[key].color,
    count: allInRange.filter((o) => o.status === key).length,
  })).filter((s) => s.count > 0);

  // How customers pay, in the range. Every order lands in exactly one row.
  const methods = [
    { key: "mpesa", name: "M-Pesa", note: "STK prompt on the customer's phone", color: "#2e9e4f" },
    { key: "cash", name: "Cash on delivery", note: "Paid to the rider, or at the shop", color: "#f0643c" },
  ].map((m) => ({ ...m, count: inRange.filter((o) => o.payment_method === m.key).length }));
  const paidCount = inRange.filter((o) => o.payment_status === "paid").length;

  // Best sellers, by units in the range.
  const sellers = new Map<string, { name: string; units: number; kes: number }>();
  for (const o of inRange) {
    for (const item of o.order_items) {
      const key = item.product_id ?? item.product_name;
      const row = sellers.get(key) ?? { name: item.product_name, units: 0, kes: 0 };
      row.units += item.qty;
      row.kes += item.line_total_kes;
      sellers.set(key, row);
    }
  }
  const bestSellers = [...sellers.values()].sort((a, b) => b.units - a.units || b.kes - a.kes).slice(0, 5);

  // Where orders go, in the range.
  const delivery = (Object.keys(DELIVERY) as DeliveryMethod[]).map((key) => ({
    key,
    ...DELIVERY[key],
    count: inRange.filter((o) => o.delivery_method === key).length,
    kes: inRange.filter((o) => o.delivery_method === key).reduce((t, o) => t + o.total_kes, 0),
  }));

  const openOrders = open.data ?? [];
  const catalogue = (products.data ?? []) as unknown as { in_stock: boolean; is_active: boolean; price_kes: number | null; product_images: { kind: string }[] }[];
  const visible = catalogue.filter((p) => p.is_active);

  return {
    range: { key: range, ...RANGES[range] },
    kpis: {
      ordered,
      paid,
      orders: inRange.length,
      cancelled: allInRange.length - inRange.length,
      average: inRange.length ? Math.round(ordered / inRange.length) : 0,
      customers,
      returning,
    },
    months,
    bestMonth: best.ordered > 0 ? best.long : null,
    yearOrdered: months.reduce((t, m) => t + m.ordered, 0),
    yearPaid: months.reduce((t, m) => t + m.paid, 0),
    statuses,
    allOrders: allInRange.length,
    methods,
    paidCount,
    unpaidCount: inRange.length - paidCount,
    bestSellers,
    delivery,
    todos: {
      toConfirm: openOrders.filter((o) => o.status === "pending").length,
      staleNew: staleNew.count ?? 0,
      needFee: openOrders.filter((o) => needsFee(o)).length,
      onTheWay: openOrders.filter((o) => o.status === "out_for_delivery").length,
      failedPayments: failed.count ?? 0,
      soldOut: visible.filter((p) => !p.in_stock).length,
      noPrice: visible.filter((p) => p.price_kes == null).length,
      noPhoto: visible.filter((p) => !p.product_images.some((i) => i.kind === "product")).length,
    },
    catalogue: { products: catalogue.length, visible: visible.length },
    latest: (latest.data ?? []) as LatestOrder[],
  };
}
