import { PlusIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductTable, type AdminProductRow } from "@/components/admin/product-table";
import { buttonClass, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { SOLD_STATUSES } from "@/lib/inventory";
import type { DiscountType } from "@/lib/pricing";
import { productImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Row = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price_kes: number | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  stock_qty: number | null;
  stock_sold: number;
  created_at: string;
  categories: { name: string };
  product_images: { kind: string; storage_path: string }[];
};
type Sale = { product_id: string; qty: number };

async function Products({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const [products, sales] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, slug, name, brand, price_kes, discount_type, discount_value, in_stock, is_active, is_featured, stock_qty, stock_sold, created_at, categories(name), product_images(kind, storage_path)",
      )
      .order("created_at", { ascending: false })
      .order("name"),
    // Units in confirmed orders, for products whose stock isn't counted.
    supabase
      .from("order_items")
      .select("product_id, qty, orders!inner(status)")
      .not("product_id", "is", null)
      .in("orders.status", SOLD_STATUSES)
      .limit(20000),
  ]);
  if (products.error) throw new Error(`Couldn't load products: ${products.error.message}`);

  const sold = new Map<string, number>();
  for (const s of (sales.data ?? []) as unknown as Sale[]) sold.set(s.product_id, (sold.get(s.product_id) ?? 0) + s.qty);

  const rows: AdminProductRow[] = (products.data as unknown as Row[]).map((row) => {
    const image = row.product_images.find((i) => i.kind === "product") ?? row.product_images[0];
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      category: row.categories.name,
      priceKes: row.price_kes,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      inStock: row.in_stock,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      stockQty: row.stock_qty,
      // Counted products show what's sold from the current Stock, so Stock - Sold = Remaining.
      sold: row.stock_qty == null ? (sold.get(row.id) ?? 0) : row.stock_sold,
      hasCleanPhoto: row.product_images.some((i) => i.kind === "product"),
      thumbnail: image ? productImageUrl(image.storage_path) : null,
      added: row.created_at,
    };
  });

  const filter = typeof params.filter === "string" ? params.filter : "";
  return <ProductTable key={filter} rows={rows} initialFilter={filter} />;
}

export default function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Prices, stock and what shows in the shop. Changes go live straight away."
        action={
          <Link href="/admin/products/new" className={buttonClass.primary}>
            <PlusIcon className="size-[18px] stroke-[2.4]" aria-hidden />
            Add product
          </Link>
        }
      />
      <Suspense fallback={<Loading label="Loading products…" />}>
        <Products searchParams={searchParams} />
      </Suspense>
    </>
  );
}
