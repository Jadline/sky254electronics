import type { Metadata } from "next";
import { one, ShopListing, type RawParams } from "@/components/shop/shop-listing";

// Old /shop?category=<slug> links are sent to /shop/<slug> by next.config.ts.

/** Search results stay out of Google; the plain shop is one canonical page. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<RawParams> }): Promise<Metadata> {
  const q = one((await searchParams).q).trim();
  return {
    title: q ? `Results for “${q}”` : "Shop",
    description: "Phones, TVs, fridges, sound systems, CCTV and accessories at Sky254 Electronics, Nairobi. Pay with M-Pesa, with delivery across Kenya.",
    alternates: { canonical: "/shop" },
    ...(q && { robots: { index: false, follow: true } }),
  };
}

export default function ShopPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  return <ShopListing searchParams={searchParams} />;
}
