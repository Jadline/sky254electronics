import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { productImageUrl } from "@/lib/storage";
import { settingsFromRow, type ShopSettings } from "@/lib/settings";
import { SITE_PAGES, type SitePage, type SitePageSlug } from "@/lib/site-pages";
import type { Category, Product, ProductPhoto } from "@/lib/types";

// The catalogue is public, so it uses the publishable key with no cookies. That
// is what lets it be cached and shared between visitors.
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // "use cache" below decides how long results live. Without no-store, Next also
      // saves the raw responses to disk and a new build would reuse the old data.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    },
  );
}

type ImageRow = { kind: "product" | "box"; storage_path: string; alt: string; sort_order: number };
type ProductRow = {
  slug: string;
  name: string;
  brand: string | null;
  price_kes: number | null;
  was_price_kes: number | null;
  warranty: string | null;
  badge: string | null;
  description: string | null;
  short_name: string | null;
  is_featured: boolean;
  show_in_hero: boolean;
  show_in_banner: boolean;
  in_stock: boolean;
  stock_qty: number | null;
  stock_sold: number;
  categories: Category;
  product_images: ImageRow[];
};

// The main photo is kind "product"; "box" is the first of the extras, which shows on hover.
function photoOf(row: ProductRow, kind: ImageRow["kind"]): ProductPhoto | null {
  const image = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order).find((i) => i.kind === kind);
  return image ? { src: productImageUrl(image.storage_path), alt: image.alt } : null;
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("products")
    .select(
      "slug, name, brand, price_kes, was_price_kes, warranty, badge, description, short_name, is_featured, show_in_hero, show_in_banner, in_stock, stock_qty, stock_sold, categories(slug, name), product_images(kind, storage_path, alt, sort_order)",
    )
    .order("created_at", { ascending: false })
    .order("name");
  if (error) throw new Error(`Couldn't load products: ${error.message}`);

  return (data as unknown as ProductRow[]).map((row) => ({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.categories,
    priceKes: row.price_kes,
    wasPriceKes: row.price_kes != null && row.was_price_kes != null && row.was_price_kes > row.price_kes ? row.was_price_kes : null,
    warranty: row.warranty,
    badge: row.badge,
    description: row.description,
    shortName: row.short_name,
    isFeatured: row.is_featured,
    showInHero: row.show_in_hero,
    showInBanner: row.show_in_banner,
    inStock: row.in_stock,
    stockQty: row.stock_qty == null ? null : row.stock_qty - row.stock_sold,
    photo: photoOf(row, "product"),
    boxPhoto: photoOf(row, "box"),
    photos: [...row.product_images]
      .sort((a, b) => a.sort_order - b.sort_order || (a.kind === "product" ? -1 : 1))
      .map((image) => ({ src: productImageUrl(image.storage_path), alt: image.alt, kind: image.kind })),
  }));
}

/** Only categories with at least one visible, in-stock product. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("categories")
    .select("slug, name, description, products!inner(id)")
    .eq("products.in_stock", true)
    .order("sort_order");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  return data.map(({ slug, name, description }) => ({ slug, name, description }));
}

/**
 * The shop's details and delivery fees from Shop settings. Falls back to empty settings
 * if they can't be read (for example before the settings migration has been run), so
 * the site still works and simply leaves those details out.
 */
export async function getShopSettings(): Promise<ShopSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("shop_settings")
    .select("email, address, hours, facebook_url, instagram_url, tiktok_url, nairobi_fee_kes, countrywide_fee_kes, free_delivery_over_kes")
    .eq("id", 1)
    .maybeSingle();
  if (error) console.error(`Couldn't load shop settings: ${error.message}`);
  return settingsFromRow(data);
}

/**
 * An information page's wording from Pages in the dashboard. Falls back to just the
 * title if it can't be read (for example before the site_pages migration has been run).
 */
export async function getSitePage(slug: SitePageSlug): Promise<SitePage> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  const { data, error } = await publicClient()
    .from("site_pages")
    .select("title, description, body, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error(`Couldn't load the ${slug} page: ${error.message}`);
  return {
    slug,
    title: data?.title?.trim() || SITE_PAGES[slug].title,
    description: data?.description?.trim() || null,
    body: data?.body ?? "",
    updatedAt: data?.updated_at ?? null,
  };
}
