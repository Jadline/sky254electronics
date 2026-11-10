import { ArrowDownTrayIcon, BellIcon, CheckIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, formatDate, initials, ksh, Loading, plural, TINTS } from "@/components/admin/ui";
import { adminName, requireAdmin } from "@/lib/admin-auth";
import { loadDashboard, RANGES, STALE_DAYS, type RangeKey } from "@/lib/admin/dashboard";
import { ORDER_STATUS, PAYMENT_STATE, paymentState } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Dashboard" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const card =
  "rounded-[20px] border border-adm-line bg-white p-[22px] transition-shadow hover:shadow-[0_14px_30px_rgba(11,27,51,0.07)]";
const SERIES = ["#0669d6", "#5b4fa8", "#0f9488", "#f0643c", "#5b6b80"];
const UNPAID = "#a9cbf2";

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Nairobi" }).format(now));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** The top of the chart's scale: four equal steps of 1, 2, 2.5 or 5 × 10ⁿ, so every gridline is a round number. */
function niceMax(n: number) {
  if (n <= 0) return 1000;
  const raw = n / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw) ?? 10 * pow;
  return step * 4;
}
const short = (n: number) => (n >= 1_000_000 ? `${Number((n / 1_000_000).toFixed(1))}M` : n >= 1000 ? `${Number((n / 1000).toFixed(1))}K` : String(Math.round(n)));

function Header() {
  return (
    <div className="-mx-4 mb-6 flex flex-wrap items-center gap-4 border-b border-adm-line bg-white px-4 py-3.5 sm:-mx-7 sm:mb-7 sm:px-7">
      <h1 className="flex-auto text-[22px] font-semibold">Dashboard</h1>
      <form action="/admin/orders" role="search" className="flex h-11 min-w-[220px] flex-[0_1_380px] items-center gap-2.5 rounded-full border-[1.5px] border-adm-line-strong px-3.5">
        <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
        <label htmlFor="adm-q" className="sr-only">
          Search orders
        </label>
        <input
          id="adm-q"
          name="q"
          type="search"
          placeholder="Search orders by number, name or phone…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
        />
      </form>
      <Suspense fallback={<span className="size-11" />}>
        <Bell />
      </Suspense>
    </div>
  );
}

/** The bell lights up while new orders wait to be confirmed. */
async function Bell() {
  const { supabase } = await requireAdmin();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
  const waiting = count ?? 0;
  return (
    <Link
      href="/admin/orders?status=pending"
      aria-label={waiting ? `${plural(waiting, "new order")} to confirm` : "Orders"}
      className="relative flex size-11 items-center justify-center rounded-full border border-adm-line hover:bg-adm-surface"
    >
      <BellIcon className="size-5" aria-hidden />
      {waiting > 0 && <span aria-hidden className="absolute top-[9px] right-2.5 size-[9px] rounded-full bg-adm-coral ring-2 ring-white" />}
    </Link>
  );
}

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const range = (typeof params.range === "string" && params.range in RANGES ? params.range : "12m") as RangeKey;
  const { supabase, user } = await requireAdmin();
  const d = await loadDashboard(supabase, range);
  const { kpis, todos } = d;

  const max = niceMax(Math.max(...d.months.map((m) => m.ordered)));
  const todoList = [
    todos.toConfirm > 0 && {
      count: todos.toConfirm,
      title: "New orders to confirm",
      text: todos.staleNew
        ? `Call the customer to confirm. ${todos.staleNew} ${todos.staleNew === 1 ? "has" : "have"} waited over ${STALE_DAYS} days`
        : "Call the customer to confirm the order",
      href: "/admin/orders?status=pending",
      tint: "bg-[#fef7e6]",
      ink: "text-[#92400e]",
    },
    todos.needFee > 0 && {
      count: todos.needFee,
      title: "Delivery fees to set",
      text: "The customer can't see a final total until you add the fee",
      href: "/admin/orders?status=fee",
      tint: "bg-adm-peach",
      ink: "text-[#b23a14]",
    },
    todos.failedPayments > 0 && {
      count: todos.failedPayments,
      title: "Failed M-Pesa payments",
      text: "The prompt was cancelled or timed out. Follow up with the customer",
      href: "/admin/payments?status=failed",
      tint: "bg-[#fdecec]",
      ink: "text-[#b42318]",
    },
    todos.onTheWay > 0 && {
      count: todos.onTheWay,
      title: "Out for delivery",
      text: "Mark them completed once the customer has them",
      href: "/admin/orders?status=out_for_delivery",
      tint: "bg-adm-teal",
      ink: "text-adm-teal-ink",
    },
    todos.soldOut > 0 && {
      count: todos.soldOut,
      title: "Sold out",
      text: "Visible in the shop, but customers can't order them",
      href: "/admin/products?filter=sold-out",
      tint: "bg-adm-lavender",
      ink: "text-adm-lavender-ink",
    },
    todos.noPrice > 0 && {
      count: todos.noPrice,
      title: "Products with no price",
      text: "They show “Ask for price” and can't go in the cart",
      href: "/admin/products?filter=no-price",
      tint: "bg-adm-surface",
      ink: "text-adm-body",
    },
  ].filter(Boolean) as { count: number; title: string; text: string; href: string; tint: string; ink: string }[];
  const allClear = [
    todos.soldOut === 0 && `All ${d.catalogue.visible} products in the shop are in stock.`,
    todos.failedPayments === 0 && "No failed payments.",
    todos.noPhoto > 0 && `${plural(todos.noPhoto, "product")} still ${todos.noPhoto === 1 ? "has" : "have"} no clean photo.`,
  ].filter(Boolean);

  const pcts = d.statuses.map((s) => (d.allOrders ? (s.count / d.allOrders) * 100 : 0));
  // Each arc starts where the ones before it end.
  const arcs = d.statuses.map((s, i) => ({
    ...s,
    dash: `${pcts[i].toFixed(2)} ${(100 - pcts[i]).toFixed(2)}`,
    offset: -pcts.slice(0, i).reduce((t, p) => t + p, 0),
  }));
  const methodTotal = d.methods.reduce((t, m) => t + m.count, 0);
  const deliveryTotal = d.delivery.reduce((t, m) => t + m.count, 0);
  const topUnits = d.bestSellers[0]?.units ?? 1;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="fade-up">
          <h2 className="text-[30px] font-semibold tracking-[-0.5px]">
            {greeting(new Date())}, {adminName(user)}
          </h2>
          <p className="mt-1 text-adm-body">
            Here is how the shop is doing. Figures come from {plural(kpis.orders, "order")} in {d.range.label}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label="Date range" className="flex rounded-full border border-adm-line bg-white p-1">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <Link
                key={key}
                href={key === "12m" ? "/admin" : `/admin?range=${key}`}
                aria-current={key === range ? "page" : undefined}
                className={`flex min-h-9 items-center rounded-full px-4 text-sm font-semibold ${key === range ? "bg-adm-primary text-white" : "text-adm-body hover:bg-adm-surface"}`}
              >
                {RANGES[key].name}
              </Link>
            ))}
          </div>
          {/* A file download, not a page: a plain link. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/orders/export"
            className="flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-adm-primary bg-white px-[18px] text-sm font-semibold text-adm-primary hover:bg-adm-tint"
          >
            <ArrowDownTrayIcon className="size-[18px]" aria-hidden />
            Export orders (CSV)
          </a>
        </div>
      </div>

      <section aria-label="Key figures" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {[
          { label: "Paid sales", value: ksh(kpis.paid), note: `Received, of ${ksh(kpis.ordered)} ordered`, glyph: "K", tint: TINTS[0] },
          { label: "Orders", value: String(kpis.orders), note: kpis.cancelled ? `Not counting ${kpis.cancelled} cancelled` : "None cancelled", glyph: "#", tint: TINTS[1] },
          { label: "New orders to confirm", value: String(todos.toConfirm), note: "Waiting for a call from the shop", glyph: "!", tint: TINTS[3] },
          { label: "Average order", value: ksh(kpis.average), note: "Order value incl. delivery", glyph: "~", tint: TINTS[2] },
          {
            label: "Customers who ordered",
            value: String(kpis.customers),
            note: kpis.returning ? `By phone number · ${kpis.returning} ordered again` : "By phone number",
            glyph: "@",
            tint: TINTS[0],
          },
        ].map((k, i) => (
          <div key={k.label} className={`${card} fade-up flex flex-col gap-2.5 !p-[18px]`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-adm-body">{k.label}</span>
              <span aria-hidden className={`flex size-[34px] items-center justify-center rounded-[10px] text-[15px] font-bold ${k.tint}`}>
                {k.glyph}
              </span>
            </div>
            <span className="text-[28px] leading-[1.1] font-semibold tracking-[-0.5px]">{k.value}</span>
            <span className="text-[13px] text-adm-muted">{k.note}</span>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-[18px] xl:grid-cols-3">
        <section aria-labelledby="sales-h" className={`${card} min-w-0 xl:col-span-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="sales-h" className="text-[19px] font-semibold">
                Sales by month
              </h2>
              <p className="mt-0.5 text-sm text-adm-muted">Order value over the last 12 months, with the part paid</p>
            </div>
            <div className="flex gap-4 text-[13px] text-adm-body">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-[3px] bg-adm-primary" />
                Paid
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: UNPAID }} />
                Not paid yet
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-7">
            <div>
              <span className="block text-[13px] text-adm-muted">Ordered</span>
              <span className="text-[22px] font-semibold">{ksh(d.yearOrdered)}</span>
            </div>
            <div>
              <span className="block text-[13px] text-adm-muted">Paid</span>
              <span className="text-[22px] font-semibold text-adm-primary">{ksh(d.yearPaid)}</span>
            </div>
            {d.bestMonth && (
              <div>
                <span className="block text-[13px] text-adm-muted">Best month</span>
                <span className="text-[22px] font-semibold">{d.bestMonth}</span>
              </div>
            )}
          </div>
          <div
            role="img"
            aria-label={`Bar chart of order value by month. ${
              d.months
                .filter((m) => m.ordered > 0)
                .map((m) => `${m.long}: ${ksh(m.ordered)} ordered, ${ksh(m.paid)} paid`)
                .join("; ") || "No orders in the last 12 months"
            }.`}
            className="mt-[18px] grid grid-cols-[44px_1fr] gap-2"
          >
            <div aria-hidden className="flex h-[220px] flex-col justify-between text-right text-xs text-adm-faint">
              {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                <span key={f}>{short(max * f)}</span>
              ))}
            </div>
            <div className="grid h-[220px] grid-cols-12 items-end gap-1.5 border-b border-adm-line bg-[linear-gradient(#eef2f6_1px,transparent_1px)] bg-[length:100%_25%] sm:gap-2.5">
              {d.months.map((m) => {
                const unpaid = m.ordered - m.paid;
                return (
                  <div key={m.key} title={`${m.long}: ${ksh(m.ordered)} ordered, ${ksh(m.paid)} paid`} className="flex h-full flex-col justify-end">
                    {unpaid > 0 && <div className="rounded-t-md" style={{ background: UNPAID, height: `${Math.max((unpaid / max) * 100, 1.5)}%` }} />}
                    {m.paid > 0 && <div className={`bg-adm-primary ${unpaid > 0 ? "" : "rounded-t-md"}`} style={{ height: `${(m.paid / max) * 100}%` }} />}
                  </div>
                );
              })}
            </div>
            <div aria-hidden />
            <div aria-hidden className="grid grid-cols-12 gap-1.5 text-center text-xs text-adm-faint sm:gap-2.5">
              {d.months.map((m) => (
                <span key={m.key}>{m.short}</span>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="todo-h" className={`${card} flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <h2 id="todo-h" className="text-[19px] font-semibold">
              Needs your attention
            </h2>
            {todoList.length > 0 && (
              <span className="rounded-full bg-[#fde9e2] px-2.5 py-0.5 text-[13px] font-semibold text-[#b23a14]">
                {plural(todoList.reduce((t, x) => t + x.count, 0), "item")}
              </span>
            )}
          </div>
          {todoList.map((t) => (
            <Link key={t.title} href={t.href} className={`flex items-center gap-3.5 rounded-[14px] p-3.5 text-adm-ink hover:brightness-[0.98] ${t.tint}`}>
              <span className={`flex h-11 min-w-11 items-center justify-center rounded-xl bg-white px-2 text-lg font-bold ${t.ink}`}>{t.count}</span>
              <span className="flex flex-1 flex-col leading-snug">
                <span className="font-semibold">{t.title}</span>
                <span className="text-[13px] text-adm-body">{t.text}</span>
              </span>
              <ChevronRightIcon className={`size-[18px] ${t.ink}`} aria-hidden />
            </Link>
          ))}
          {todoList.length === 0 && <p className="text-sm text-adm-body">Nothing waiting. Every order is confirmed and has its delivery fee.</p>}
          {allClear.length > 0 && (
            <div className="flex items-center gap-2.5 rounded-[14px] border border-dashed border-adm-line-strong px-3.5 py-3 text-sm text-adm-body">
              <CheckIcon className="size-[18px] shrink-0 stroke-2 text-adm-primary" aria-hidden />
              {allClear.join(" ")}
            </div>
          )}
        </section>
      </div>

      <div className="grid items-start gap-[18px] md:grid-cols-2 xl:grid-cols-3">
        <section aria-labelledby="status-h" className={card}>
          <h2 id="status-h" className="text-[19px] font-semibold">
            Order status
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">Where the orders from {d.range.label} stand, cancelled included</p>
          <div className="mt-4 flex flex-wrap items-center gap-[22px]">
            <div className="relative size-[156px] shrink-0">
              <svg
                width="156"
                height="156"
                viewBox="0 0 42 42"
                role="img"
                aria-label={`Order status: ${d.statuses.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(", ") || "no orders"}`}
              >
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef2f6" strokeWidth="5" />
                {arcs.map((a) => (
                  <circle
                    key={a.key}
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke={a.color}
                    strokeWidth="5"
                    strokeDasharray={a.dash}
                    strokeDashoffset={a.offset}
                    transform="rotate(-90 21 21)"
                  />
                ))}
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                <span className="text-[26px] font-bold">{d.allOrders}</span>
                <span className="text-xs text-adm-muted">orders</span>
              </span>
            </div>
            <ul className="flex min-w-[150px] flex-1 flex-col gap-2.5">
              {arcs.map((a) => (
                <li key={a.key}>
                  <Link href={`/admin/orders?status=${a.key}`} className="flex items-center gap-2.5 text-sm hover:text-adm-primary">
                    <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: a.color }} />
                    <span className="flex-1">{a.label}</span>
                    <strong>{a.count}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {d.allOrders === 0 && <p className="mt-3 text-sm text-adm-muted">No orders in {d.range.label}.</p>}
        </section>

        <section aria-labelledby="pay-h" className={card}>
          <h2 id="pay-h" className="text-[19px] font-semibold">
            How customers pay
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">
            {plural(kpis.orders, "order")} in {d.range.label}
          </p>
          <div aria-hidden className="mt-[18px] flex h-3.5 gap-[3px] overflow-hidden rounded-full bg-adm-line-soft">
            {d.methods.map((m) => (m.count ? <span key={m.key} style={{ width: `${(m.count / methodTotal) * 100}%`, background: m.color }} /> : null))}
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {d.methods.map((m) => (
              <li key={m.key} className="flex items-center gap-3">
                <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: m.color }} />
                <span className="flex flex-1 flex-col leading-snug">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[13px] text-adm-muted">{m.note}</span>
                </span>
                <span className="text-right leading-snug">
                  <strong className="block">{plural(m.count, "order")}</strong>
                  <span className="text-[13px] text-adm-muted">{methodTotal ? Math.round((m.count / methodTotal) * 100) : 0}%</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] bg-adm-tint p-3">
              <span className="block text-[13px] text-adm-primary-dark">Paid</span>
              <strong className="text-lg">{plural(d.paidCount, "order")}</strong>
            </div>
            <div className="rounded-[14px] bg-adm-peach p-3">
              <span className="block text-[13px] text-[#9a3412]">Not paid yet</span>
              <strong className="text-lg">{plural(d.unpaidCount, "order")}</strong>
            </div>
          </div>
        </section>

        <section aria-labelledby="best-h" className={card}>
          <div className="flex items-baseline justify-between gap-2.5">
            <h2 id="best-h" className="text-[19px] font-semibold">
              Best sellers
            </h2>
            <Link href="/admin/products" className="text-sm font-semibold text-adm-primary hover:text-adm-primary-dark">
              All products ›
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-adm-muted">By units in orders, {d.range.label}</p>
          {d.bestSellers.length === 0 ? (
            <p className="mt-4 text-sm text-adm-muted">No orders in {d.range.label}.</p>
          ) : (
            <ol className="mt-3.5 flex flex-col gap-3">
              {d.bestSellers.map((b, i) => (
                <li key={b.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2.5 text-sm">
                    <span className="font-medium">{b.name}</span>
                    <span className="whitespace-nowrap text-adm-body">
                      {plural(b.units, "unit")} · {ksh(b.kes)}
                    </span>
                  </div>
                  <span aria-hidden className="block h-2 rounded-full bg-adm-line-soft">
                    <span className="block h-full rounded-full" style={{ width: `${(b.units / topUnits) * 100}%`, background: SERIES[i] }} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Side by side only on very wide screens: the orders table needs the room. */}
      <div className="grid items-start gap-[18px] 2xl:grid-cols-3">
        <section aria-labelledby="recent-h" className={`${card} min-w-0 2xl:col-span-2`}>
          <div className="flex items-baseline justify-between gap-2.5">
            <h2 id="recent-h" className="text-[19px] font-semibold">
              Latest orders
            </h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-adm-primary hover:text-adm-primary-dark">
              All orders ›
            </Link>
          </div>
          {d.latest.length === 0 ? (
            <p className="mt-4 text-sm text-adm-muted">No orders yet. They appear here as soon as someone checks out.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-[13px] text-adm-muted">
                  <tr>
                    {["Order", "Customer", "Date", "Payment", "Status"].map((h) => (
                      <th key={h} scope="col" className="px-2.5 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                    <th scope="col" className="px-2.5 py-2 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.latest.map((o, i) => {
                    const pay = PAYMENT_STATE[paymentState(o)];
                    const st = ORDER_STATUS[o.status];
                    return (
                      <tr key={o.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                        <td className="px-2.5 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-semibold whitespace-nowrap text-adm-primary hover:text-adm-primary-dark">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-2.5 py-3">
                          <span className="flex items-center gap-2.5 whitespace-nowrap">
                            <span aria-hidden className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${TINTS[i % 4]}`}>
                              {initials(o.customer_name)}
                            </span>
                            {o.customer_name}
                          </span>
                        </td>
                        <td className="px-2.5 py-3 whitespace-nowrap text-adm-body">{formatDate(o.created_at)}</td>
                        <td className="px-2.5 py-3">
                          <Badge tone={pay.tone}>
                            {o.payment_method === "mpesa" ? "M-Pesa" : "Cash"} · {pay.label}
                          </Badge>
                        </td>
                        <td className="px-2.5 py-3">
                          <Badge tone={st.tone} dot>
                            {st.label}
                          </Badge>
                        </td>
                        <td className="px-2.5 py-3 text-right font-semibold whitespace-nowrap">{ksh(o.total_kes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="where-h" className={card}>
          <h2 id="where-h" className="text-[19px] font-semibold">
            Where orders go
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">
            {plural(kpis.orders, "order")} in {d.range.label}, by delivery choice
          </p>
          {deliveryTotal === 0 ? (
            <p className="mt-4 text-sm text-adm-muted">No orders in {d.range.label}.</p>
          ) : (
            <ol className="mt-3.5 flex flex-col gap-1">
              {d.delivery.map((m, i) => (
                <li key={m.key} className="flex items-center gap-3 border-b border-adm-line-soft py-2.5 last:border-b-0">
                  <span aria-hidden className={`flex size-7 items-center justify-center rounded-lg text-[13px] font-bold ${TINTS[i % 4]}`}>
                    {i + 1}
                  </span>
                  <span className="flex flex-1 flex-col leading-snug">
                    <span>{m.label}</span>
                    <span className="text-[13px] text-adm-muted">{ksh(m.kes)}</span>
                  </span>
                  <span className="text-right leading-snug">
                    <strong className="block">{plural(m.count, "order")}</strong>
                    <span className="text-[13px] text-adm-muted">{Math.round((m.count / deliveryTotal) * 100)}%</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <footer className="flex flex-wrap justify-between gap-2.5 px-0.5 pt-1.5 text-[13px] text-adm-muted">
        <span>© {new Date().getFullYear()} Sky254 Electronics · Shop admin</span>
        <span>Figures are counted from orders in the database, never typed in.</span>
      </footer>
    </div>
  );
}

export default function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <Header />
      <Suspense fallback={<Loading label="Adding up the figures…" />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}
