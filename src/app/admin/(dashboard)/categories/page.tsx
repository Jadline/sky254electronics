import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/components/admin/category-manager";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Categories" };

async function Categories() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, products(count)")
    .order("sort_order");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  const rows = (data as unknown as { id: string; name: string; products: { count: number }[] }[]).map((row) => ({
    id: row.id,
    name: row.name,
    count: row.products[0]?.count ?? 0,
  }));
  return <CategoryManager rows={rows} />;
}

export default function CategoriesPage() {
  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Categories</h1>
        <p className="text-sm text-muted">The shop only shows a category while it has products in stock.</p>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Categories />
      </Suspense>
    </main>
  );
}
