"use client";

import { BanknotesIcon, CheckIcon, ClockIcon, EyeIcon, MagnifyingGlassIcon, TruckIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { setOrderStatus } from "@/app/admin/actions";
import { paginate, Pager } from "@/components/admin/pager";
import { RowMenu } from "@/components/admin/row-menu";
import { Badge, formatDate, formatTime, initials, ksh, SEARCH_BOX } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";
import {
  DELIVERY,
  nextStatus,
  ORDER_STATUS,
  PAYMENT_STATE,
  prettyPhone,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentMethod,
  type PaymentState,
} from "@/lib/admin/orders";

export type OrderRow = {
  id: string;
  number: string;
  name: string;
  phone: string;
  email: string;
  status: OrderStatus;
  pay: PaymentState;
  method: PaymentMethod;
  delivery: DeliveryMethod;
  needsFee: boolean;
  placed: string;
  items: number;
  qty: number;
  total: number;
};

const PAGE = 20;

type TileKey = "all" | OrderStatus | "fee";
const TILES: { key: TileKey; label: string; icon: typeof ClockIcon | null; bg: string; ink: string; ring: string }[] = [
  { key: "all", label: "Sales", icon: null, bg: "bg-adm-tint", ink: "text-adm-primary", ring: "border-adm-primary" },
  { key: "pending", label: "New, to confirm", icon: ClockIcon, bg: "bg-[#fef7e6]", ink: "text-[#92400e]", ring: "border-[#d97706]" },
  { key: "fee", label: "Delivery fee to set", icon: BanknotesIcon, bg: "bg-adm-peach", ink: "text-adm-peach-ink", ring: "border-adm-peach-ink" },
  { key: "confirmed", label: "Confirmed", icon: CheckIcon, bg: "bg-adm-lavender", ink: "text-adm-lavender-ink", ring: "border-adm-lavender-ink" },
  { key: "out_for_delivery", label: "Out for delivery", icon: TruckIcon, bg: "bg-adm-teal", ink: "text-adm-teal-ink", ring: "border-adm-teal-ink" },
  { key: "completed", label: "Completed", icon: CheckIcon, bg: "bg-[#e7f6ec]", ink: "text-[#116632]", ring: "border-[#116632]" },
  { key: "cancelled", label: "Cancelled", icon: XCircleIcon, bg: "bg-adm-surface", ink: "text-adm-muted", ring: "border-adm-muted" },
];

const matchesTile = (o: OrderRow, key: TileKey) => key === "all" || (key === "fee" ? o.needsFee : o.status === key);

/** Digits only, with 07… and 2547… treated alike, so a phone search finds either form. */
const digits = (s: string) => s.replace(/\D/g, "").replace(/^0/, "254");

export function OrdersList({ orders, initialStatus, initialQuery }: { orders: OrderRow[]; initialStatus: string; initialQuery: string }) {
  const router = useRouter();
  const [tile, setTile] = useState<TileKey>(TILES.some((t) => t.key === initialStatus) ? (initialStatus as TileKey) : "all");
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const change = useAdminAction(setOrderStatus);

  // Sales: the value of every order that wasn't cancelled.
  const sales = orders.filter((o) => o.status !== "cancelled").reduce((t, o) => t + o.total, 0);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^#/, "");
    const tDigits = digits(t);
    return orders.filter(
      (o) =>
        matchesTile(o, tile) &&
        (!t ||
          o.name.toLowerCase().includes(t) ||
          o.email.toLowerCase().includes(t) ||
          o.number.toLowerCase().includes(t) ||
          (tDigits.length >= 3 && digits(o.phone).includes(tDigits))),
    );
  }, [orders, tile, q]);
  const { pages, current, shown, summary } = paginate(rows, page, PAGE);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="hist-h" className="rounded-[20px] border border-adm-line bg-white">
        <div className="px-[22px] pt-5">
          <h2 id="hist-h" className="text-lg font-semibold">
            Orders history
          </h2>
          <span className="text-[13px] text-adm-muted">All orders · tap a tile to filter the table</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 px-[22px] pt-4 pb-5">
          {TILES.map((t) => {
            const count = orders.filter((o) => matchesTile(o, t.key)).length;
            if (t.key === "fee" && count === 0) return null;
            const on = tile === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setTile(t.key);
                  setPage(1);
                }}
                className={`relative flex min-h-24 cursor-pointer flex-col gap-0.5 rounded-2xl border-[1.5px] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,27,51,0.08)] ${t.bg} ${on ? t.ring : "border-transparent"}`}
              >
                <span className="pr-10 text-2xl leading-tight font-semibold">{t.key === "all" ? ksh(sales) : count}</span>
                <span className="text-sm text-adm-body">{t.label}</span>
                <span aria-hidden className={`absolute top-3.5 right-3.5 flex size-[34px] items-center justify-center rounded-[10px] bg-white ${t.ink}`}>
                  {Icon ? <Icon className="size-[18px]" /> : <span className="text-[15px] font-bold">K</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-adm-line-soft px-[22px] py-3.5">
          <h2 className="text-lg font-semibold">Orders table</h2>
          <div className={`${SEARCH_BOX} flex-[0_1_380px]`}>
            <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
            <label htmlFor="o-q" className="sr-only">
              Search orders
            </label>
            <input
              id="o-q"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, email or order number"
              className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
            />
          </div>
        </div>

        {change.notice && (
          <div className="px-[22px] pb-3">
            <ActionNotice notice={change.notice} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
              <tr>
                {["Order", "Customer", "Payment", "Status", "Delivery", "Placed"].map((h, i) => (
                  <th key={h} scope="col" className={`py-3 font-semibold ${i === 0 ? "pr-3 pl-[22px]" : "px-3"}`}>
                    {h}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Items
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Total
                </th>
                <th scope="col" className="w-[50px] py-3 pr-[22px] pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const pay = PAYMENT_STATE[o.pay];
                const st = ORDER_STATUS[o.status];
                const href = `/admin/orders/${o.id}`;
                const next = nextStatus(o.status, o.delivery);
                const isNew = o.status === "pending";
                return (
                  <tr
                    key={o.id}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("a,button,input,label")) router.push(href);
                    }}
                    className={`cursor-pointer border-t border-adm-line-soft hover:bg-[#f8fafd] ${isNew ? "bg-[#fffcf5]" : ""}`}
                  >
                    <td className="py-3 pr-3 pl-[22px] whitespace-nowrap">
                      <Link href={href} className="font-mono text-[13px] font-semibold text-adm-primary hover:text-adm-primary-dark">
                        {o.number}
                      </Link>
                      {isNew && <span className="ml-2 rounded-full bg-adm-coral px-2 py-px text-[11px] font-bold tracking-[0.4px] text-white uppercase">New</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2.5 whitespace-nowrap">
                        <span aria-hidden className="flex size-[34px] items-center justify-center rounded-full bg-adm-tint text-xs font-bold text-adm-primary-dark">
                          {initials(o.name)}
                        </span>
                        <span className="flex flex-col leading-snug">
                          <strong className="font-semibold">{o.name}</strong>
                          <span className="text-[13px] text-adm-muted">{prettyPhone(o.phone)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex flex-col items-start gap-0.5 leading-snug">
                        <Badge tone={pay.tone} dot>
                          {pay.label}
                        </Badge>
                        <span className="text-[13px] text-adm-muted">{o.method === "mpesa" ? "M-Pesa" : "Cash"}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex flex-col leading-snug">
                        <span>{DELIVERY[o.delivery].short}</span>
                        {o.needsFee && <span className="text-[13px] font-medium text-adm-peach-ink">Fee not set</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex flex-col leading-snug">
                        <span>{formatDate(o.placed)}</span>
                        <span className="text-[13px] text-adm-muted">{formatTime(o.placed)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {o.qty}
                      {o.items !== o.qty && <span className="block text-[13px] text-adm-muted">{o.items} lines</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">{ksh(o.total)}</td>
                    <td className="py-2 pr-[22px] pl-3 text-right">
                      <RowMenu
                        label={`Actions for order ${o.number}`}
                        items={[
                          { label: "View order", icon: EyeIcon, href },
                          next && { label: next.label, icon: next.status === "out_for_delivery" ? TruckIcon : CheckIcon, onSelect: () => change.run(o.id, next.status) },
                          o.status !== "cancelled" &&
                            o.status !== "completed" && {
                              label: "Cancel order",
                              confirm: "Click again to cancel",
                              icon: XCircleIcon,
                              danger: true,
                              onSelect: () => change.run(o.id, "cancelled"),
                            },
                          o.status === "cancelled" && { label: "Reopen as new", icon: ClockIcon, onSelect: () => change.run(o.id, "pending") },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <p className="px-[18px] py-10 text-center text-adm-muted">
            {orders.length ? "No orders match. Try another tile or search." : "No orders yet. They appear here as soon as someone checks out."}
          </p>
        )}
        <Pager page={current} pages={pages} onPage={setPage}>
          {summary || "0 orders"}
        </Pager>
      </section>
    </div>
  );
}
