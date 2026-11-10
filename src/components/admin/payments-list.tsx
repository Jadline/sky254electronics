"use client";

import { BanknotesIcon, CheckIcon, ClockIcon, MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";
import { paginate, Pager } from "@/components/admin/pager";
import { Badge, formatDate, formatTime, ksh, SEARCH_BOX, type Tone } from "@/components/admin/ui";
import { prettyPhone } from "@/lib/admin/orders";

export type PaymentRow = {
  id: string;
  kind: "mpesa" | "cash";
  orderId: string | null;
  orderNumber: string;
  customer: string;
  phone: string;
  amount: number;
  state: "paid" | "pending" | "failed" | "due";
  reference: string;
  note: string;
  cancelledOrder: boolean;
  when: string;
};

const PAGE = 20;

const STATE: Record<PaymentRow["state"], { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "green" },
  pending: { label: "In progress", tone: "amber" },
  failed: { label: "Failed", tone: "red" },
  due: { label: "Cash to collect", tone: "indigo" },
};

type TileKey = "all" | PaymentRow["state"];
const TILES: { key: TileKey; label: string; icon: typeof CheckIcon | null; bg: string; ink: string; ring: string }[] = [
  { key: "all", label: "Received", icon: null, bg: "bg-adm-tint", ink: "text-adm-primary", ring: "border-adm-primary" },
  { key: "paid", label: "Paid", icon: CheckIcon, bg: "bg-[#e7f6ec]", ink: "text-[#116632]", ring: "border-[#116632]" },
  { key: "pending", label: "M-Pesa in progress", icon: ClockIcon, bg: "bg-[#fef7e6]", ink: "text-[#92400e]", ring: "border-[#d97706]" },
  { key: "failed", label: "M-Pesa failed", icon: XCircleIcon, bg: "bg-[#fdecec]", ink: "text-[#b42318]", ring: "border-[#b42318]" },
  { key: "due", label: "Cash to collect", icon: BanknotesIcon, bg: "bg-adm-lavender", ink: "text-adm-lavender-ink", ring: "border-adm-lavender-ink" },
];

export function PaymentsList({ payments, initialStatus }: { payments: PaymentRow[]; initialStatus: string }) {
  const [tile, setTile] = useState<TileKey>(TILES.some((t) => t.key === initialStatus) ? (initialStatus as TileKey) : "all");
  const [kind, setKind] = useState<"all" | "mpesa" | "cash">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const received = payments.filter((p) => p.state === "paid").reduce((t, p) => t + p.amount, 0);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const tDigits = t.replace(/\D/g, "").replace(/^0/, "254");
    return payments.filter(
      (p) =>
        (tile === "all" || p.state === tile) &&
        (kind === "all" || p.kind === kind) &&
        (!t ||
          p.customer.toLowerCase().includes(t) ||
          p.orderNumber.toLowerCase().includes(t) ||
          p.reference.toLowerCase().includes(t) ||
          (tDigits.length >= 3 && p.phone.includes(tDigits))),
    );
  }, [payments, tile, kind, q]);
  const { pages, current, shown, summary } = paginate(rows, page, PAGE);

  return (
    <section aria-labelledby="pay-h" className="rounded-[20px] border border-adm-line bg-white">
      <div className="px-[22px] pt-5">
        <h2 id="pay-h" className="text-lg font-semibold">
          Payments
        </h2>
        <span className="text-[13px] text-adm-muted">Tap a tile to filter the table</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 px-[22px] pt-4 pb-5">
        {TILES.map((t) => {
          const count = payments.filter((p) => t.key === "all" || p.state === t.key).length;
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
              <span className="pr-10 text-2xl leading-tight font-semibold">{t.key === "all" ? ksh(received) : count}</span>
              <span className="text-sm text-adm-body">{t.label}</span>
              <span aria-hidden className={`absolute top-3.5 right-3.5 flex size-[34px] items-center justify-center rounded-[10px] bg-white ${t.ink}`}>
                {Icon ? <Icon className="size-[18px]" /> : <span className="text-[15px] font-bold">K</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-adm-line-soft px-[22px] py-3.5">
        <div role="group" aria-label="Payment method" className="inline-flex gap-1 rounded-xl border border-adm-line bg-adm-surface p-1">
          {(
            [
              ["all", "All"],
              ["mpesa", "M-Pesa"],
              ["cash", "Cash"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={`flex min-h-9 cursor-pointer items-center rounded-[9px] px-3.5 text-sm font-semibold ${kind === k ? "bg-white text-adm-primary-dark shadow-[0_1px_3px_rgba(11,27,51,0.14)]" : "text-adm-muted hover:text-adm-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={`${SEARCH_BOX} ml-auto flex-[0_1_380px]`}>
          <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
          <label htmlFor="p-q" className="sr-only">
            Search payments
          </label>
          <input
            id="p-q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, order or M-Pesa receipt"
            className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
            <tr>
              <th scope="col" className="py-3 pr-3 pl-[22px] font-semibold">
                When
              </th>
              {["Order", "Customer", "Method", "Status", "Receipt"].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 font-semibold">
                  {h}
                </th>
              ))}
              <th scope="col" className="py-3 pr-[22px] pl-3 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const st = STATE[p.state];
              return (
                <tr key={p.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                  <td className="py-3 pr-3 pl-[22px] whitespace-nowrap">
                    <span className="flex flex-col leading-snug">
                      <span>{formatDate(p.when)}</span>
                      <span className="text-[13px] text-adm-muted">{formatTime(p.when)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {p.orderId ? (
                      <Link href={`/admin/orders/${p.orderId}`} className="font-mono text-[13px] font-semibold text-adm-primary hover:text-adm-primary-dark">
                        {p.orderNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {p.cancelledOrder && <span className="block text-[13px] text-adm-muted">Order cancelled</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex flex-col leading-snug whitespace-nowrap">
                      <strong className="font-semibold">{p.customer}</strong>
                      <span className="text-[13px] text-adm-muted">{prettyPhone(p.phone)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{p.kind === "mpesa" ? "M-Pesa" : "Cash"}</td>
                  <td className="px-3 py-3">
                    <span className="flex flex-col items-start gap-0.5 leading-snug">
                      <Badge tone={st.tone} dot>
                        {st.label}
                      </Badge>
                      {p.note && p.state !== "paid" && <span className="max-w-[260px] text-[13px] text-adm-muted">{p.note}</span>}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px]">{p.reference || <span className="font-sans text-adm-faint">—</span>}</td>
                  <td className="py-3 pr-[22px] pl-3 text-right font-semibold whitespace-nowrap">{ksh(p.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && (
        <p className="px-[18px] py-10 text-center text-adm-muted">
          {payments.length ? "No payments match. Try another tile or search." : "No payments yet. M-Pesa payments appear here as soon as a customer pays."}
        </p>
      )}
      <Pager page={current} pages={pages} onPage={setPage}>
        {summary || "0 payments"}
      </Pager>
    </section>
  );
}
