import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductTable, type AdminProductRow } from "@/components/admin/product-table";
import { PRIMARY_BUTTON } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { productImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  slug: string;
  name: string;
  price_kes: number | null;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  categories: { name: string };
  product_images: { kind: string; storage_path: string }[];
};

async function Products() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, price_kes, in_stock, is_active, is_featured, categories(name), product_images(kind, storage_path)")
    .order("created_at", { ascending: false })
    .order("name");
  if (error) throw new Error(`Couldn't load products: ${error.message}`);

  const rows: AdminProductRow[] = (data as unknown as Row[]).map((row) => {
    const image = row.product_images.find((i) => i.kind === "product") ?? row.product_images[0];
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.categories.name,
      priceKes: row.price_kes,
      inStock: row.in_stock,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      hasCleanPhoto: row.product_images.some((i) => i.kind === "product"),
      thumbnail: image ? productImageUrl(image.storage_path) : null,
    };
  });

  return <ProductTable rows={rows} />;
}

export default function AdminProductsPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-medium">Products</h1>
        <Link href="/admin/products/new" className={PRIMARY_BUTTON}>Add product</Link>
      </div>
      <Suspense fallback={<p className="text-muted">Loading products…</p>}>
        <Products />
      </Suspense>
    </main>
  );
}
