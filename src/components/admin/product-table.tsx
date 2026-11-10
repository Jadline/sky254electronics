"use client";

import { ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, PencilIcon, PhotoIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { removeProduct, setProductDiscount, setProductPrice, setProductStock, setProductSwitch } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/dialogs";
import { paginate, Pager } from "@/components/admin/pager";
import { RowMenu } from "@/components/admin/row-menu";
import { SEARCH_BOX, SELECT_PILL } from "@/components/admin/ui";
import { ActionNotice, useAdminAction, type Notice } from "@/components/admin/use-admin-action";
import { LOW_STOCK } from "@/lib/inventory";
import { salePrice, type DiscountType } from "@/lib/pricing";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  priceKes: number | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  /** How many the shop had when the stock was last typed in. null = not counted. */
  stockQty: number | null;
  /** Units in confirmed orders: since the stock was typed in, or ever when it isn't counted. */
  sold: number;
  hasCleanPhoto: boolean;
  thumbnail: string | null;
  added: string;
};

const PAGE = 25;

/** The price after the product's discount, or null when it has none. */
const saleOf = (r: AdminProductRow) => salePrice(r.priceKes, r.discountType, r.discountValue);

/** Stock - Sold for counted products; null when the stock isn't counted. */
const remainingOf = (r: AdminProductRow) => (r.stockQty == null ? null : Math.max(0, r.stockQty - r.sold));

const FILTERS = [
  { id: "all", label: "All products", dot: "bg-adm-primary", test: () => true },
  { id: "sold-out", label: "Sold out", dot: "bg-adm-coral", test: (r: AdminProductRow) => !r.inStock },
  {
    id: "low-stock",
    label: "Low stock",
    dot: "bg-[#f59e0b]",
    test: (r: AdminProductRow) => {
      const left = remainingOf(r);
      return left != null && left > 0 && left <= LOW_STOCK;
    },
  },
  { id: "on-sale", label: "On sale", dot: "bg-[#d92d20]", test: (r: AdminProductRow) => saleOf(r) != null },
  { id: "no-price", label: "No price", dot: "bg-[#d97706]", test: (r: AdminProductRow) => r.priceKes == null },
  { id: "hidden", label: "Hidden", dot: "bg-adm-faint", test: (r: AdminProductRow) => !r.isActive },
  { id: "featured", label: "Featured", dot: "bg-adm-lavender-ink", test: (r: AdminProductRow) => r.isFeatured },
  { id: "no-photo", label: "No clean photo", dot: "bg-adm-teal-ink", test: (r: AdminProductRow) => !r.hasCleanPhoto },
] as const;

const SORTS: Record<string, (a: AdminProductRow, b: AdminProductRow) => number> = {
  newest: (a, b) => b.added.localeCompare(a.added),
  name: (a, b) => a.name.localeCompare(b.name, "en", { numeric: true }),
  "price-high": (a, b) => (b.priceKes ?? -1) - (a.priceKes ?? -1),
  "price-low": (a, b) => (a.priceKes ?? Infinity) - (b.priceKes ?? Infinity),
  remaining: (a, b) => (remainingOf(a) ?? Infinity) - (remainingOf(b) ?? Infinity) || a.name.localeCompare(b.name),
  selling: (a, b) => b.sold - a.sold || a.name.localeCompare(b.name),
};

/** An on/off switch that flips at once and saves in the background. */
function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: (next: boolean) => Promise<unknown> }) {
  const [shown, setShown] = useOptimistic(on);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setShown(!shown);
          await onToggle(!shown);
        })
      }
      className={`inline-flex h-[26px] w-[46px] cursor-pointer rounded-full p-[3px] align-middle transition-colors disabled:cursor-wait ${shown ? "bg-adm-primary" : "bg-adm-line-strong"}`}
    >
      <span className={`size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(11,27,51,0.25)] transition-transform ${shown ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** The price, typed straight into the table. Saves on Enter or when you leave the box. */
function PriceInput({ row, onNotice }: { row: AdminProductRow; onNotice: (n: Notice) => void }) {
  const [pending, startTransition] = useTransition();
  const [bad, setBad] = useState(false);
  const saved = row.priceKes == null ? "" : String(row.priceKes);

  function save(input: HTMLInputElement) {
    const value = input.value.replace(/[,\s]/g, "");
    if (value === saved) return;
    startTransition(async () => {
      const result = await setProductPrice(row.id, value);
      setBad(Boolean(result.error));
      onNotice(result.error ? { tone: "error", text: `${row.name}: ${result.error}` } : { tone: "ok", text: `Price saved for ${row.name}` });
    });
  }

  return (
    <label className={`ml-auto flex h-10 w-[132px] items-center gap-1.5 rounded-[10px] border bg-white px-2.5 focus-within:ring-2 focus-within:ring-adm-primary/20 ${bad ? "border-[#b42318]" : "border-adm-line-strong focus-within:border-adm-primary"}`}>
      <span className="text-xs text-adm-muted">KSh</span>
      <input
        key={saved}
        defaultValue={saved}
        inputMode="numeric"
        placeholder="No price"
        aria-label={`Price for ${row.name}`}
        aria-invalid={bad || undefined}
        disabled={pending}
        onBlur={(e) => save(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = saved;
            e.currentTarget.blur();
          }
        }}
        className="w-full min-w-0 bg-transparent text-right text-sm font-semibold outline-0 placeholder:font-normal placeholder:text-[#b42318]"
      />
    </label>
  );
}

/** The discount, typed straight into the table: a number and % or KSh. Blank removes it. */
function DiscountInput({ row, onNotice }: { row: AdminProductRow; onNotice: (n: Notice) => void }) {
  const [pending, startTransition] = useTransition();
  const [bad, setBad] = useState(false);
  const [type, setType] = useState<DiscountType>(row.discountType ?? "percent");
  const input = useRef<HTMLInputElement>(null);
  const saved = row.discountValue == null ? "" : String(row.discountValue);

  function save(rawValue: string, nextType: DiscountType) {
    const value = rawValue.replace(/[,\s%]/g, "");
    // Nothing to do: the same discount, or switching % and KSh with no number yet.
    if (value === saved && (nextType === (row.discountType ?? "percent") || value === "")) return;
    startTransition(async () => {
      const result = await setProductDiscount(row.id, nextType, value);
      setBad(Boolean(result.error));
      onNotice(result.error ? { tone: "error", text: `${row.name}: ${result.error}` } : { tone: "ok", text: `${row.name}: ${result.message}` });
    });
  }

  return (
    <span
      className={`ml-auto flex h-10 w-[118px] items-center overflow-hidden rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-adm-primary/20 ${bad ? "border-[#b42318]" : "border-adm-line-strong focus-within:border-adm-primary"}`}
    >
      <input
        ref={input}
        defaultValue={saved}
        inputMode="numeric"
        placeholder="—"
        aria-label={`Discount for ${row.name}`}
        aria-invalid={bad || undefined}
        disabled={pending}
        onBlur={(e) => save(e.currentTarget.value, type)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = saved;
            e.currentTarget.blur();
          }
        }}
        className="h-full w-full min-w-0 bg-transparent px-2.5 text-right text-sm font-semibold outline-0 placeholder:font-normal placeholder:text-adm-faint"
      />
      <select
        value={type}
        disabled={pending}
        aria-label={`Discount type for ${row.name}`}
        onChange={(e) => {
          const next = e.target.value as DiscountType;
          setType(next);
          save(input.current?.value ?? "", next);
        }}
        className="h-full flex-none cursor-pointer border-l border-adm-line-soft bg-adm-surface px-1.5 text-xs font-semibold text-adm-body outline-0"
      >
        <option value="percent">%</option>
        <option value="amount">KSh</option>
      </select>
    </span>
  );
}

/** What customers pay: the sale price in red when discounted, else the price. */
function CurrentPrice({ row }: { row: AdminProductRow }) {
  if (row.priceKes == null) return <span className="text-adm-faint">—</span>;
  const sale = saleOf(row);
  if (sale == null) return <span className="tabular-nums text-adm-body">KSh {row.priceKes.toLocaleString("en-KE")}</span>;
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className="font-semibold tabular-nums text-[#d92d20]">KSh {sale.toLocaleString("en-KE")}</span>
      <s className="text-xs tabular-nums text-adm-faint">KSh {row.priceKes.toLocaleString("en-KE")}</s>
    </span>
  );
}

/**
 * How many the shop has, typed straight into the table. Saves when you leave the box if it
 * changed, or on Enter even when it didn't (a recount of the same number starts Sold again).
 */
function StockInput({ row, onNotice }: { row: AdminProductRow; onNotice: (n: Notice) => void }) {
  const [pending, startTransition] = useTransition();
  const [bad, setBad] = useState(false);
  const saved = row.stockQty == null ? "" : String(row.stockQty);

  function save(input: HTMLInputElement, force: boolean) {
    const value = input.value.replace(/[,\s]/g, "");
    if (value === saved && !force) return;
    startTransition(async () => {
      const result = await setProductStock(row.id, value);
      setBad(Boolean(result.error));
      onNotice(result.error ? { tone: "error", text: `${row.name}: ${result.error}` } : { tone: "ok", text: `${row.name}: ${result.message}` });
    });
  }

  return (
    <input
      key={`${saved}-${row.sold}`}
      defaultValue={saved}
      inputMode="numeric"
      placeholder="—"
      title="How many you have now. Leave empty to not count this product."
      aria-label={`Stock for ${row.name}`}
      aria-invalid={bad || undefined}
      disabled={pending}
      onBlur={(e) => save(e.currentTarget, false)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          save(e.currentTarget, true);
        }
        if (e.key === "Escape") {
          e.currentTarget.value = saved;
          e.currentTarget.blur();
        }
      }}
      className={`ml-auto block h-10 w-[76px] rounded-[10px] border bg-white px-2.5 text-right text-sm font-semibold outline-0 placeholder:font-normal placeholder:text-adm-faint focus:ring-2 focus:ring-adm-primary/20 ${bad ? "border-[#b42318]" : "border-adm-line-strong focus:border-adm-primary"}`}
    />
  );
}

/** Stock - Sold, in amber when low and red when nothing remains. */
function Remaining({ row }: { row: AdminProductRow }) {
  const left = remainingOf(row);
  if (left == null) return <span className="text-adm-faint">—</span>;
  const color = left === 0 ? "text-[#b42318]" : left <= LOW_STOCK ? "text-[#b45309]" : "";
  return <span className={`font-semibold tabular-nums ${color}`}>{left}</span>;
}

export function ProductTable({ rows, initialFilter }: { rows: AdminProductRow[]; initialFilter: string }) {
  const [filter, setFilter] = useState<string>(FILTERS.some((f) => f.id === initialFilter) ? initialFilter : "all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminProductRow | null>(null);
  const toggle = useAdminAction(setProductSwitch);
  const remove = useAdminAction(removeProduct);
  const [priceNotice, setPriceNotice] = useState<Notice>(null);
  const notice = remove.notice ?? toggle.notice ?? priceNotice;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const visible = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    return rows
      .filter((row) => {
        const text = `${row.name} ${row.brand ?? ""} ${row.category}`.toLowerCase();
        return test(row) && (category === "all" || row.category === category) && words.every((word) => text.includes(word));
      })
      .sort(SORTS[sort]);
  }, [rows, search, filter, category, sort]);
  const { pages, current, shown, summary } = paginate(visible, page, PAGE);
  const reset = () => setPage(1);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Catalogue figures" className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        {FILTERS.map((f, i) => {
          const count = rows.filter(f.test).length;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                reset();
              }}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`fade-up flex cursor-pointer flex-col gap-1.5 rounded-[18px] border-[1.5px] bg-white p-[18px] text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,27,51,0.08)] ${filter === f.id ? "border-adm-primary" : "border-adm-line"}`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-adm-body">{f.label}</span>
                <span aria-hidden className={`size-2.5 rounded-full ${f.dot}`} />
              </span>
              <span className="text-[28px] leading-[1.1] font-semibold">{count}</span>
            </button>
          );
        })}
      </section>

      <section aria-labelledby="list-h" className="rounded-[20px] border border-adm-line bg-white">
        <h2 id="list-h" className="sr-only">
          Product list
        </h2>
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
          <div className={`${SEARCH_BOX} flex-[1_1_260px]`}>
            <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
            <label htmlFor="p-q" className="sr-only">
              Search products
            </label>
            <input
              id="p-q"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                reset();
              }}
              placeholder="Search name, brand or category…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
            />
          </div>
          {categories.length > 1 && (
            <>
              <label htmlFor="p-cat" className="sr-only">
                Filter by category
              </label>
              <select
                id="p-cat"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  reset();
                }}
                className={SELECT_PILL}
              >
                <option value="all">All categories ({rows.length})</option>
                {categories.map(([name, count]) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))}
              </select>
            </>
          )}
          <label htmlFor="p-sort" className="sr-only">
            Sort products
          </label>
          <select id="p-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT_PILL}>
            <option value="newest">Newest first</option>
            <option value="name">Name: A to Z</option>
            <option value="price-high">Price: high to low</option>
            <option value="price-low">Price: low to high</option>
            <option value="remaining">Fewest remaining</option>
            <option value="selling">Most sold</option>
          </select>
        </div>

        {notice && (
          <div className="px-[18px] pt-3">
            <ActionNotice notice={notice} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">
                  Product
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Price
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold" title="A percentage or shillings off the price">
                  Discount
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold" title="What customers pay">
                  Current price
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold" title="How many you had when you last typed it in. Type a new number after a delivery or a recount.">
                  Stock
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold" title="Units in confirmed orders">
                  Sold
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold" title="Stock minus Sold">
                  Remaining
                </th>
                <th scope="col" className="px-3 py-3 text-center font-semibold">
                  In stock
                </th>
                <th scope="col" className="px-3 py-3 text-center font-semibold">
                  Visible
                </th>
                <th scope="col" className="px-3 py-3 text-center font-semibold">
                  Featured
                </th>
                <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const editHref = `/admin/products/${r.id}`;
                return (
                  <tr key={r.id} className={`border-t border-adm-line-soft hover:bg-[#f8fafd] ${r.isActive ? "" : "bg-[#fafbfc]"}`}>
                    <td className="py-2.5 pr-3 pl-[18px]">
                      <span className="flex items-center gap-3">
                        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-adm-line-soft bg-adm-surface">
                          {r.thumbnail ? (
                            <Image src={r.thumbnail} alt="" fill sizes="48px" className={r.hasCleanPhoto ? "object-contain p-1" : "object-cover"} />
                          ) : (
                            <PhotoIcon className="size-5 text-adm-faint" aria-hidden />
                          )}
                        </span>
                        <span className="flex min-w-0 flex-col leading-snug">
                          <Link href={editHref} className={`font-semibold hover:text-adm-primary ${r.isActive ? "" : "text-adm-muted"}`}>
                            {r.name}
                          </Link>
                          <span className="text-[13px] text-adm-muted">
                            {[r.brand, r.category].filter(Boolean).join(" · ")}
                            {!r.isActive && " · Hidden"}
                            {!r.hasCleanPhoto && " · No clean photo"}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <PriceInput row={r} onNotice={setPriceNotice} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <DiscountInput key={`${r.discountType}-${r.discountValue}`} row={r} onNotice={setPriceNotice} />
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CurrentPrice row={r} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <StockInput row={r} onNotice={setPriceNotice} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.sold || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Remaining row={r} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Switch on={r.inStock} label={`${r.name} in stock`} onToggle={(on) => toggle.run(r.id, "in_stock", on)} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Switch on={r.isActive} label={`${r.name} visible in the shop`} onToggle={(on) => toggle.run(r.id, "is_active", on)} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <FeaturedStar on={r.isFeatured} name={r.name} onToggle={(on) => toggle.run(r.id, "is_featured", on)} />
                    </td>
                    <td className="py-2 pr-[18px] pl-3 text-right">
                      <RowMenu
                        label={`Actions for ${r.name}`}
                        items={[
                          { label: "Edit product", icon: PencilIcon, href: editHref },
                          r.isActive && { label: "View in the shop", icon: ArrowTopRightOnSquareIcon, href: `/products/${r.slug}`, external: true },
                          { label: "Delete product", icon: TrashIcon, danger: true, onSelect: () => setDeleting(r) },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && <p className="px-[18px] py-10 text-center text-adm-muted">No products match. Try another filter or search.</p>}
        <Pager page={current} pages={pages} onPage={setPage}>
          {summary || "0 products"}
        </Pager>
      </section>

      <ConfirmDialog
        open={deleting != null}
        title={`Delete ${deleting?.name ?? "this product"}?`}
        confirmLabel="Delete product"
        pending={remove.pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.run(deleting.id);
          setDeleting(null);
        }}
      >
        Its photos are deleted too, and this can&apos;t be undone. Past orders keep the product&apos;s name. To take it down for now, switch off
        “Visible” instead.
      </ConfirmDialog>
    </div>
  );
}

function FeaturedStar({ on, name, onToggle }: { on: boolean; name: string; onToggle: (next: boolean) => Promise<unknown> }) {
  const [shown, setShown] = useOptimistic(on);
  const [pending, startTransition] = useTransition();
  const Icon = shown ? StarSolid : StarIcon;
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={`Feature ${name} on the Home page`}
      title={shown ? "Featured on the Home page" : "Not featured"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setShown(!shown);
          await onToggle(!shown);
        })
      }
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-adm-surface disabled:cursor-wait"
    >
      <Icon className={`size-5 ${shown ? "text-[#f0a020]" : "text-adm-line-strong"}`} />
    </button>
  );
}
