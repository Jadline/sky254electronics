// The shop listing: search, filters, sorting and pages. Used by /shop and /shop/<category>.
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard, ProductCardRow } from "@/components/product-card";
import { ServiceList } from "@/components/service-list";
import { SideTitle } from "@/components/side-title";
import { AutoSubmitSelect } from "@/components/shop/auto-submit-select";
import { getCategories, getProducts } from "@/lib/catalog";
import { categoryHref, type Category, type Product } from "@/lib/types";

export type RawParams = Record<string, string | string[] | undefined>;
type Filters = {
  q: string;
  category: string;
  brands: string[];
  min: string;
  max: string;
  sort: string;
  show: number;
  page: number;
  view: string;
};

const SHOW_OPTIONS = [15, 30, 60];
const SORTS = [
  { value: "", label: "Default sorting" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

export const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function readFilters(raw: RawParams, categorySlug = ""): Filters {
  const show = Number(one(raw.show));
  const page = Number(one(raw.page));
  const brand = raw.brand;
  return {
    q: one(raw.q).trim(),
    category: categorySlug,
    brands: (Array.isArray(brand) ? brand : brand ? [brand] : []).filter(Boolean),
    min: one(raw.min).trim(),
    max: one(raw.max).trim(),
    sort: one(raw.sort),
    show: SHOW_OPTIONS.includes(show) ? show : SHOW_OPTIONS[0],
    page: Number.isInteger(page) && page > 0 ? page : 1,
    view: one(raw.view) === "list" ? "list" : "grid",
  };
}

/** The page a set of filters lives on: /shop/<category> for a category, else /shop. */
const basePath = (category: string) => (category ? categoryHref(category) : "/shop");

/** Builds a shop URL from the current filters. Any change goes back to page 1. */
function shopHref(filters: Filters, changes: Partial<Filters> = {}) {
  const f = { ...filters, page: 1, ...changes };
  const url = new URLSearchParams();
  if (f.q) url.set("q", f.q);
  f.brands.forEach((brand) => url.append("brand", brand));
  if (f.min) url.set("min", f.min);
  if (f.max) url.set("max", f.max);
  if (f.sort) url.set("sort", f.sort);
  if (f.show !== SHOW_OPTIONS[0]) url.set("show", String(f.show));
  if (f.view !== "grid") url.set("view", f.view);
  if (f.page > 1) url.set("page", String(f.page));
  const query = url.toString();
  return query ? `${basePath(f.category)}?${query}` : basePath(f.category);
}

function matchesSearch(product: Product, q: string) {
  const text = `${product.name} ${product.brand ?? ""} ${product.category.name}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((word) => text.includes(word));
}

function applyFilters(products: Product[], f: Filters) {
  const min = f.min === "" ? NaN : Number(f.min);
  const max = f.max === "" ? NaN : Number(f.max);
  const list = products.filter((p) => {
    if (f.q && !matchesSearch(p, f.q)) return false;
    if (f.category && p.category.slug !== f.category) return false;
    if (f.brands.length && !f.brands.includes(p.brand ?? "")) return false;
    if (!Number.isNaN(min) && (p.priceKes == null || p.priceKes < min)) return false;
    if (!Number.isNaN(max) && (p.priceKes == null || p.priceKes > max)) return false;
    return true;
  });

  const byPrice = (a: Product, b: Product, direction: number) =>
    a.priceKes == null ? 1 : b.priceKes == null ? -1 : (a.priceKes - b.priceKes) * direction;
  if (f.sort === "price-asc") list.sort((a, b) => byPrice(a, b, 1));
  if (f.sort === "price-desc") list.sort((a, b) => byPrice(a, b, -1));
  if (f.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

/** Keeps the other filters when a form on this page is submitted. */
function Hidden({ filters, omit }: { filters: Filters; omit: (keyof Filters | "brand")[] }) {
  const fields: [string, string][] = [];
  const add = (key: keyof Filters, value: string) => {
    if (value && !omit.includes(key)) fields.push([key, value]);
  };
  add("q", filters.q);
  add("min", filters.min);
  add("max", filters.max);
  add("sort", filters.sort);
  add("show", filters.show !== SHOW_OPTIONS[0] ? String(filters.show) : "");
  add("view", filters.view !== "grid" ? filters.view : "");
  if (!omit.includes("brand")) filters.brands.forEach((brand) => fields.push(["brand", brand]));
  return fields.map(([name, value]) => <input key={name + value} type="hidden" name={name} value={value} />);
}

async function ShopResults({ searchParams, categorySlug }: { searchParams: Promise<RawParams>; categorySlug?: string }) {
  const [raw, products, categories] = await Promise.all([searchParams, getProducts(), getCategories()]);
  const filters = readFilters(raw, categorySlug);

  const results = applyFilters(products, filters);
  const pages = Math.max(1, Math.ceil(results.length / filters.show));
  const page = Math.min(filters.page, pages);
  const start = (page - 1) * filters.show;
  const visible = results.slice(start, start + filters.show);

  const inCategory = filters.category ? products.filter((p) => p.category.slug === filters.category) : products;
  const brands = [...new Set(inCategory.flatMap((p) => p.brand ?? []))].sort((a, b) => a.localeCompare(b));
  const activeCategory: Category | undefined = categories.find((c) => c.slug === filters.category) ?? products.find((p) => p.category.slug === filters.category)?.category;
  const title = filters.q ? `Results for “${filters.q}”` : (activeCategory?.name ?? "All products");
  const hasFilters = !!(filters.q || filters.category || filters.brands.length || filters.min || filters.max);
  const filterCount = filters.brands.length + (filters.min ? 1 : 0) + (filters.max ? 1 : 0);

  return (
    <>
      <div className="mx-auto w-full max-w-[1860px] px-6 pt-[22px] pb-[26px] max-sm:px-4 max-sm:pt-4 max-sm:pb-5">
        <div className="border-b border-line pb-[26px] max-sm:pb-4">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 text-[13px]">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden="true">&gt;</span>
            {activeCategory ? (
              <>
                <Link href="/shop" className="hover:text-brand">Shop</Link>
                <span aria-hidden="true">&gt;</span>
                <span className="text-muted">{activeCategory.name}</span>
              </>
            ) : (
              <span className="text-muted">Shop</span>
            )}
          </nav>
          <h1 className="mt-3 text-[26px] font-normal max-sm:mt-2 max-sm:text-[22px]">{title}</h1>
          {!filters.q && activeCategory?.description && <p className="mt-2 max-w-[760px] text-sm text-body">{activeCategory.description}</p>}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[1860px] flex-wrap items-start gap-[30px] px-6 pb-20 max-lg:gap-5 max-sm:px-4">
        {/* Phones and tablets: categories and filters fold away behind this toggle, so the
            products come first. No script needed: the checkbox opens the panel. */}
        <input type="checkbox" id="shop-filters" className="peer sr-only" />
        <label
          htmlFor="shop-filters"
          className="flex h-11 flex-[1_1_100%] cursor-pointer items-center justify-between border border-line px-4 text-[13px] font-medium uppercase peer-focus-visible:outline-2 peer-focus-visible:outline-brand lg:hidden"
        >
          <span>
            Categories &amp; filters
            {filterCount > 0 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] text-white">{filterCount}</span>}
          </span>
          <span aria-hidden="true" className="text-lg leading-none">+</span>
        </label>
        <aside className="flex min-w-60 flex-[0_1_270px] flex-col gap-[30px] max-lg:hidden max-lg:flex-[1_1_100%] max-lg:gap-5 peer-checked:max-lg:flex">
          <section>
            <SideTitle>Product categories</SideTitle>
            <div className="flex flex-col border border-line px-[22px] py-[18px]">
              <Link
                href={shopHref(filters, { category: "", brands: [] })}
                className={`py-2 text-[13px] transition-colors hover:text-brand ${filters.category ? "" : "font-medium text-brand"}`}
              >
                All products <span className="text-xs text-muted">({products.length})</span>
              </Link>
              {categories.map((category) => {
                const active = category.slug === filters.category;
                const count = products.filter((p) => p.category.slug === category.slug).length;
                return (
                  <Link
                    key={category.slug}
                    href={shopHref(filters, { category: category.slug, brands: [] })}
                    aria-current={active ? "true" : undefined}
                    className={`py-2 text-[13px] transition-colors hover:text-brand ${active ? "font-medium text-brand" : ""}`}
                  >
                    {category.name} <span className="text-xs text-muted">({count})</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <form action={basePath(filters.category)} className="flex flex-col gap-[30px]">
            <Hidden filters={filters} omit={["min", "max", "brand"]} />
            <section>
              <SideTitle>Price (KSh)</SideTitle>
              <div className="flex gap-2.5 border border-line p-[18px]">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
                  Min
                  <input type="number" name="min" min={0} defaultValue={filters.min} className="h-10 w-full border border-line px-2.5 text-sm text-text" />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
                  Max
                  <input type="number" name="max" min={0} defaultValue={filters.max} className="h-10 w-full border border-line px-2.5 text-sm text-text" />
                </label>
              </div>
            </section>
            {brands.length > 0 && (
              <section>
                <SideTitle>Brand</SideTitle>
                <div className="flex flex-col border border-line px-[22px] py-3">
                  {brands.map((brand) => (
                    <label key={brand} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-[13px]">
                      <input
                        type="checkbox"
                        name="brand"
                        value={brand}
                        defaultChecked={filters.brands.includes(brand)}
                        className="size-4 accent-brand"
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </section>
            )}
            <button type="submit" className="btn-lift h-10 cursor-pointer rounded-full bg-brand text-[13px] font-medium text-white uppercase">
              Apply filters
            </button>
          </form>

          <div className="max-lg:hidden">
            <ServiceList />
          </div>
        </aside>

        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-[22px]">
          <div className="flex flex-wrap items-center gap-3.5 max-sm:flex-nowrap max-sm:gap-2">
            <form action={basePath(filters.category)} className="flex min-w-0 flex-wrap gap-3.5 max-sm:flex-1 max-sm:flex-nowrap max-sm:gap-2">
              <Hidden filters={filters} omit={["sort", "show"]} />
              <AutoSubmitSelect name="sort" aria-label="Sort by" defaultValue={filters.sort} className="h-10 w-48 border border-line bg-white px-3.5 text-[13px] max-sm:w-auto max-sm:min-w-0 max-sm:flex-1 max-sm:px-2.5">
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>{sort.label}</option>
                ))}
              </AutoSubmitSelect>
              <AutoSubmitSelect name="show" aria-label="Products per page" defaultValue={filters.show} className="h-10 w-28 border border-line bg-white px-3.5 text-[13px] max-sm:w-[92px] max-sm:px-2">
                {SHOW_OPTIONS.map((n) => (
                  <option key={n} value={n}>Show: {n}</option>
                ))}
              </AutoSubmitSelect>
            </form>
            <div className="ml-auto flex gap-1.5 max-sm:gap-0">
              {[
                { view: "grid", label: "Grid view", path: "M3 3h5v5H3zM10 3h5v5h-5zM17 3h4v5h-4zM3 10h5v5H3zM10 10h5v5h-5zM17 10h4v5h-4zM3 17h5v4H3zM10 17h5v4h-5zM17 17h4v4h-4z" },
                { view: "list", label: "List view", path: "M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z" },
              ].map((option) => (
                <Link
                  key={option.view}
                  href={shopHref(filters, { view: option.view, page })}
                  aria-label={option.label}
                  aria-current={filters.view === option.view ? "true" : undefined}
                  className={`flex size-10 items-center justify-center transition-colors hover:text-brand ${filters.view === option.view ? "text-brand" : "text-muted"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="size-[22px]" aria-hidden="true">
                    <path d={option.path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-4 border border-line px-6 py-20 text-center">
              <p className="text-xl font-light">We couldn&apos;t find anything matching that.</p>
              <p className="text-sm text-muted">Try a different word, or remove some filters.</p>
              <Link href="/shop" className="btn-lift inline-flex h-10 items-center rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase">
                See all products
              </Link>
            </div>
          ) : filters.view === "list" ? (
            <div className="grid gap-5">
              {visible.map((product) => (
                <ProductCardRow key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="cg-side grid gap-y-[30px]">
              {visible.map((product, i) => (
                <ProductCard key={product.slug} product={product} index={i} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-[30px] flex flex-wrap items-center justify-between gap-4">
              <nav aria-label="Pagination" className="flex flex-wrap gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={shopHref(filters, { page: n })}
                    aria-current={n === page ? "page" : undefined}
                    className={`flex size-10 items-center justify-center border text-[13px] transition-colors ${n === page ? "border-brand bg-brand text-white" : "border-line hover:border-brand hover:text-brand"}`}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
              <span className="text-[13px] text-body">
                Showing {start + 1}–{start + visible.length} of {results.length} {results.length === 1 ? "result" : "results"}
                {hasFilters && (
                  <>
                    {" · "}
                    <Link href="/shop" className="text-brand">Clear filters</Link>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/** The shop listing for /shop and the category pages at /shop/<category>. */
export function ShopListing({ searchParams, categorySlug }: { searchParams: Promise<RawParams>; categorySlug?: string }) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1860px] flex-1 px-6 py-24 text-center text-muted">Loading products…</main>
      }
    >
      <ShopResults searchParams={searchParams} categorySlug={categorySlug} />
    </Suspense>
  );
}
