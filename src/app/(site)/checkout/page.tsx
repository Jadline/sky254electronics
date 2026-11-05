import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const products = await getProducts();
  return (
    <>
      <PageHeading title="Checkout" />
      <main className="mx-auto w-full max-w-[1860px] px-6 pt-[50px] pb-[90px] lg:pl-[324px]">
        <CheckoutForm products={products} />
      </main>
    </>
  );
}
