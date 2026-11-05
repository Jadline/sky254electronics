"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FIELD } from "@/components/admin/ui";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/order-labels";
import { formatKes } from "@/lib/types";

export type AdminOrderRow = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: string;
  phone: string;
  totalKes: number;
  placed: string;
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-accent text-text",
  confirmed: "bg-tint text-brand-dark",
  out_for_delivery: "bg-tint text-brand-dark",
  completed: "bg-[#e7f6ec] text-[#116632]",
  cancelled: "bg-[#f1f3f7] text-muted",
};

export function OrderTable({ rows }: { rows: AdminOrderRow[] }) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.toLowerCase().replace(/\s+/g, "");
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      return !q || `${row.number}${row.customer}${row.phone}`.toLowerCase().replace(/\s+/g, "").includes(q);
    });
  }, [rows, filter, search]);

  const tabs: { id: OrderStatus | "all"; label: string }[] = [
    { id: "all", label: "All" },
    ...(Object.entries(ORDER_STATUSES) as [OrderStatus, string][]).map(([id, label]) => ({
      id,
      label: id === "pending" ? "New" : label,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Order number, name or phone…"
          aria-label="Search orders"
          className={`${FIELD} !w-72 max-w-full`}
        />
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`h-9 cursor-pointer border px-3 text-xs font-medium transition-colors ${filter === tab.id ? "border-brand bg-brand text-white" : "border-[#cfd5e1] bg-white hover:border-text"}`}
            >
              {tab.label} ({tab.id === "all" ? rows.length : rows.filter((row) => row.status === tab.id).length})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Customer</th>
              <th scope="col" className="px-4 py-3 font-medium">Placed</th>
              <th scope="col" className="px-4 py-3 font-medium">Total</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-[#f5f7fb]">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${row.id}`} className="font-medium text-brand">{row.number}</Link>
                </td>
                <td className="px-4 py-3">
                  {row.customer}
                  <span className="block text-xs text-muted">{row.phone}</span>
                </td>
                <td className="px-4 py-3 text-body">{row.placed}</td>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{formatKes(row.totalKes)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLE[row.status]}`}>{ORDER_STATUSES[row.status]}</span>
                </td>
                <td className="px-4 py-3 text-body">{PAYMENT_STATUSES[row.paymentStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted">
            {rows.length === 0 ? "No orders yet. They'll appear here as soon as customers check out." : "No orders match that."}
          </p>
        )}
      </div>
    </div>
  );
}
