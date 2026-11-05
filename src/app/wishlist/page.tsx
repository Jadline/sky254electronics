import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { WishlistView } from "@/components/shop/wishlist-view";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeading title="Wishlist" />
      <main className="mx-auto w-full max-w-[1860px] px-6 pt-[50px] pb-[90px] lg:pl-[324px]">
        <WishlistView products={products} />
      </main>
    </>
  );
}
