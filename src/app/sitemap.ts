import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getCategories, getProducts } from "@/lib/catalog";
import { SITE_PAGES } from "@/lib/site-pages";
import { categoryHref, productHref } from "@/lib/types";

/** /sitemap.xml: every public page Google should find. Rebuilt as the catalogue changes. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.8 },
    ...categories.map((category) => ({
      url: absoluteUrl(categoryHref(category.slug)),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(productHref(product.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      images: product.photos.slice(0, 5).map((photo) => absoluteUrl(photo.src)),
    })),
    ...Object.values(SITE_PAGES).map((page) => ({
      url: absoluteUrl(page.path),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
