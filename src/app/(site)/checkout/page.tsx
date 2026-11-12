import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { site } from "@/config/site";
import { getDelivery, getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [products, delivery] = await Promise.all([getProducts(), getDelivery()]);
  return (
    <>
      <PageHeading title="Checkout" />
      <main className="mx-auto w-full max-w-[1860px] px-6 pt-[50px] pb-[90px] max-sm:px-4 max-sm:pt-6 max-sm:pb-14 lg:pl-[324px]">
        <CheckoutForm products={products} delivery={delivery} shopPhone={site.phone} />
      </main>
    </>
  );
}
