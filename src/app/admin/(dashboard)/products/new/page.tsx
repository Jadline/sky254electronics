import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Add product" };

async function NewProduct() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");
  return <ProductForm categories={categories ?? []} />;
}

/** The form draws its own header, with the Cancel, Save as draft and Publish buttons. */
export default function NewProductPage() {
  return (
    <div className="pt-1">
      <Suspense fallback={<Loading />}>
        <NewProduct />
      </Suspense>
    </div>
  );
}
