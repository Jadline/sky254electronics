import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteProduct } from "@/app/admin/actions";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { PhotoManager, type AdminPhoto } from "@/components/admin/photo-manager";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin-auth";
import { productImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Edit product" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function EditProduct({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("product_images").select("id, kind, storage_path, bytes").eq("product_id", id),
  ]);
  if (!product) notFound();

  const photo = (kind: string): AdminPhoto | undefined => {
    const image = images?.find((i) => i.kind === kind);
    return image ? { id: image.id, url: productImageUrl(image.storage_path), bytes: image.bytes } : undefined;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{product.name}</h1>
          {query.new === "1" && (
            <p role="status" className="text-sm text-[#15803d]">Product added. Now add its photos below.</p>
          )}
        </div>
        {product.is_active && (
          <Link href={`/products/${product.slug}`} className="text-sm text-brand">View in the shop →</Link>
        )}
      </div>
      <ProductForm values={product} categories={categories ?? []} />
      <PhotoManager
        productId={product.id}
        slug={product.slug}
        photos={{ product: photo("product"), box: photo("box") }}
      />
      <section className="flex flex-col gap-3 border border-line bg-white p-6">
        <h2 className="text-lg font-medium">Delete this product</h2>
        <p className="text-sm text-muted">
          This also deletes its photos and can&apos;t be undone. To take it down for now, turn off “Visible in the shop” instead.
        </p>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <DeleteProductButton name={product.name} />
        </form>
      </section>
    </>
  );
}

export default function EditProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <main className="flex max-w-4xl flex-col gap-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <EditProduct params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
