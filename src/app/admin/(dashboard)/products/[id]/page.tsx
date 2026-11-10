import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { PhotoManager, type AdminPhoto } from "@/components/admin/photo-manager";
import { ProductForm } from "@/components/admin/product-form";
import { Badge, buttonClass, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { productImageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Edit product" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const crumbs = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
];

async function EditProduct({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("product_images").select("id, storage_path, bytes").eq("product_id", id).order("sort_order").order("created_at"),
  ]);
  if (!product) notFound();

  const photos: AdminPhoto[] = (images ?? []).map((image) => ({
    id: image.id,
    url: productImageUrl(image.storage_path),
    bytes: image.bytes,
  }));

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        back={{ href: "/admin/products", label: "Back to products" }}
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {product.is_active ? (
              <Badge tone="green" dot>
                Visible in the shop
              </Badge>
            ) : (
              <Badge tone="gray" dot>
                Hidden
              </Badge>
            )}
            {!product.in_stock && <Badge tone="amber">Sold out</Badge>}
            {product.is_featured && <Badge tone="indigo">Featured</Badge>}
          </span>
        }
        action={
          product.is_active && (
            <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className={buttonClass.outline}>
              View in the shop <ArrowTopRightOnSquareIcon className="size-4" aria-hidden />
            </a>
          )
        }
      />
      <div className="flex flex-col gap-[18px]">
        {query.new && (
          <p
            role="status"
            className={`rounded-[14px] px-4 py-3 text-sm font-medium ${query.new === "photo-failed" ? "bg-[#fef3e2] text-[#93400d]" : "bg-[#e7f6ec] text-[#116632]"}`}
          >
            {query.draft === "1" ? "Saved as a draft. It stays hidden until you switch on “Visible in the shop”." : "Product published."}{" "}
            {query.new === "photo-failed" && "A photo couldn't be uploaded. Please add it again below."}
            {query.new === "no-photos" && "You can add its photos below."}
          </p>
        )}
        <ProductForm values={product} categories={categories ?? []} photoCount={photos.length} />
        <PhotoManager productId={product.id} slug={product.slug} photos={photos} />
        <section className="flex flex-col gap-3 rounded-[20px] border border-[#f6d5d1] bg-white px-[22px] py-5">
          <div>
            <h2 className="text-lg font-semibold">Delete this product</h2>
            <p className="mt-0.5 text-sm text-adm-muted">
              This also deletes its photos and can&apos;t be undone. To take it down for now, switch off “Visible in the shop” instead.
            </p>
          </div>
          <DeleteProductButton id={product.id} name={product.name} />
        </section>
      </div>
    </>
  );
}

export default function EditProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Loading />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}
