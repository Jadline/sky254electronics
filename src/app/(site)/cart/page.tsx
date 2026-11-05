import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { CartView } from "@/components/shop/cart-view";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeading title="Cart" />
      <main className="mx-auto w-full max-w-[1860px] px-6 pt-[50px] pb-[90px] lg:pl-[324px]">
        <CartView products={products} />
      </main>
    </>
  );
}
