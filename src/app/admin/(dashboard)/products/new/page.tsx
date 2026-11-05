import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Add product" };

async function NewProduct() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");
  return <ProductForm categories={categories ?? []} />;
}

export default function NewProductPage() {
  return (
    <main className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Add product</h1>
        <p className="text-sm text-muted">You can add photos on the next step.</p>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <NewProduct />
      </Suspense>
    </main>
  );
}
