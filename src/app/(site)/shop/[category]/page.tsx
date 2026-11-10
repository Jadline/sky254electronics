import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { ShopListing, type RawParams } from "@/components/shop/shop-listing";
import { site } from "@/config/site";
import { getCategories, getProducts } from "@/lib/catalog";
import { categoryHref, type Category } from "@/lib/types";

type Params = Promise<{ category: string }>;

/** A category, or undefined. Includes categories whose products are all out of stock. */
async function findCategory(slug: string): Promise<Category | undefined> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return categories.find((c) => c.slug === slug) ?? products.find((p) => p.category.slug === slug)?.category;
}

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const category = await findCategory((await params).category);
  if (!category) return { title: "Category not found" };
  const path = categoryHref(category.slug);
  const description =
    category.description || `Shop ${category.name} at ${site.name} in Nairobi. Genuine products, M-Pesa payment and delivery across Kenya.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${category.name} | ${site.name}`, description, url: path },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: Promise<RawParams> }) {
  const category = await findCategory((await params).category);
  if (!category) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: categoryHref(category.slug) },
        ])}
      />
      <ShopListing searchParams={searchParams} categorySlug={category.slug} />
    </>
  );
}
