import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { productImageUrl } from "@/lib/storage";
import type { Category, Product, ProductPhoto } from "@/lib/types";

// The catalogue is public, so it uses the publishable key with no cookies. That
// is what lets it be cached and shared between visitors.
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

type ImageRow = { kind: "product" | "box"; storage_path: string; alt: string };
type ProductRow = {
  slug: string;
  name: string;
  brand: string | null;
  price_kes: number | null;
  warranty: string | null;
  badge: string | null;
  in_stock: boolean;
  categories: Category;
  product_images: ImageRow[];
};

function photoOf(row: ProductRow, kind: ImageRow["kind"]): ProductPhoto | null {
  const image = row.product_images.find((i) => i.kind === kind);
  return image ? { src: productImageUrl(image.storage_path), alt: image.alt } : null;
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("products")
    .select(
      "slug, name, brand, price_kes, warranty, badge, in_stock, categories(slug, name), product_images(kind, storage_path, alt)",
    )
    .order("created_at");
  if (error) throw new Error(`Couldn't load products: ${error.message}`);

  return (data as unknown as ProductRow[]).map((row) => ({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.categories,
    priceKes: row.price_kes,
    warranty: row.warranty,
    badge: row.badge,
    inStock: row.in_stock,
    photo: photoOf(row, "product"),
    boxPhoto: photoOf(row, "box"),
  }));
}

/** Only categories with at least one visible, in-stock product. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("categories")
    .select("slug, name, products!inner(id)")
    .eq("products.in_stock", true)
    .order("sort_order");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  return data.map(({ slug, name }) => ({ slug, name }));
}
