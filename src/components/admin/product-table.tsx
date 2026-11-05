"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { quickUpdate, type FormState } from "@/app/admin/actions";
import { FIELD } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceKes: number | null;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  hasCleanPhoto: boolean;
  thumbnail: string | null;
};

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "no-price", label: "No price", test: (r: AdminProductRow) => r.priceKes == null },
  { id: "sold-out", label: "Sold out", test: (r: AdminProductRow) => !r.inStock },
  { id: "hidden", label: "Hidden", test: (r: AdminProductRow) => !r.isActive },
  { id: "featured", label: "Featured", test: (r: AdminProductRow) => r.isFeatured },
  { id: "no-photo", label: "No clean photo", test: (r: AdminProductRow) => !r.hasCleanPhoto },
];

function ProductRow({ row }: { row: AdminProductRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(quickUpdate, {});
  const [dirty, setDirty] = useState(false);
  const submit = useKeepValues(action);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        setDirty(false);
        submit(event);
      }}
      onChange={() => setDirty(true)}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-white px-4 py-3 last:border-b-0"
    >
      <input type="hidden" name="id" value={row.id} />
      <span className="relative size-14 flex-none bg-tint">
        {row.thumbnail && (
          <Image src={row.thumbnail} alt="" fill sizes="56px" className={row.hasCleanPhoto ? "object-contain" : "object-cover"} />
        )}
      </span>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
        <Link href={`/admin/products/${row.id}`} className="truncate text-sm font-medium text-text hover:text-brand">
          {row.name}
        </Link>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          {row.category}
          {!row.isActive && <span className="bg-[#f1f3f7] px-1.5 py-0.5 font-medium text-text">Hidden</span>}
          {row.isFeatured && <span className="bg-accent px-1.5 py-0.5 font-medium text-text">Featured</span>}
        </span>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted">
        KSh
        <input
          name="price_kes"
          inputMode="numeric"
          defaultValue={row.priceKes ?? ""}
          placeholder="No price"
          aria-label={`Price for ${row.name}`}
          className={`${FIELD} !h-10 !w-28`}
        />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="in_stock" defaultChecked={row.inStock} aria-label={`${row.name} in stock`} className="size-4 accent-brand" />
        In stock
      </label>
      <div className="flex w-[140px] items-center justify-end gap-3 text-xs">
        {state.error && <span role="alert" className="text-[#b42318]">{state.error}</span>}
        {!dirty && state.message && <span role="status" className="text-[#15803d]">{state.message}</span>}
        {dirty ? (
          <button type="submit" disabled={pending} className="h-10 cursor-pointer bg-brand px-4 text-sm font-medium text-white disabled:opacity-60">
            Save
          </button>
        ) : (
          <Link href={`/admin/products/${row.id}`} className="flex h-10 items-center text-sm text-brand">Edit</Link>
        )}
      </div>
    </form>
  );
}

export function ProductTable({ rows }: { rows: AdminProductRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    return rows.filter((row) => {
      const text = `${row.name} ${row.category}`.toLowerCase();
      return test(row) && words.every((word) => text.includes(word));
    });
  }, [rows, search, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className={`${FIELD} !w-72 max-w-full`}
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count = rows.filter(f.test).length;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 cursor-pointer border px-3 text-xs font-medium transition-colors ${filter === f.id ? "border-brand bg-brand text-white" : "border-[#cfd5e1] bg-white hover:border-text"}`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>
      <div className="border border-line">
        {visible.map((row) => (
          <ProductRow key={row.id} row={row} />
        ))}
        {visible.length === 0 && <p className="bg-white px-4 py-12 text-center text-sm text-muted">No products match that.</p>}
      </div>
    </div>
  );
}
