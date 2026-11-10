import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/components/admin/category-manager";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Categories" };

type Row = { id: string; name: string; slug: string; description: string | null; products: { in_stock: boolean; is_active: boolean }[] };

async function Categories() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select("id, name, slug, description, products(in_stock, is_active)").order("sort_order");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  const rows = (data as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    count: row.products.length,
    // What decides whether the shop shows the category at all.
    live: row.products.filter((p) => p.is_active && p.in_stock).length,
    // Products not switched off with "Visible in the shop", in stock or not.
    visible: row.products.filter((p) => p.is_active).length,
  }));
  return <CategoryManager rows={rows} />;
}

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories" description="The shop only shows a category while it has products on sale: visible and in stock." />
      <Suspense fallback={<Loading />}>
        <Categories />
      </Suspense>
    </>
  );
}
