import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductTabs } from "@/components/home/product-tabs";
import { PhoneIcon, TruckIcon } from "@/components/icons";
import { BuyBox } from "@/components/product/buy-box";
import { ProductGallery } from "@/components/product/gallery";
import { ReadMore } from "@/components/product/read-more";
import { ProductCard, ProductCardMini } from "@/components/product-card";
import { ServiceList } from "@/components/service-list";
import { SideTitle } from "@/components/side-title";
import { site } from "@/config/site";
import { getCategories, getDelivery, getProducts, getReviews, getShopSettings } from "@/lib/catalog";
import { shippingRate } from "@/lib/delivery";
import { summarise } from "@/lib/reviews";
import { ProductReviews } from "@/components/product/product-reviews";
import { Stars } from "@/components/product/stars";
import { categoryHref, priceText, productHref, type Product } from "@/lib/types";
import { WasPrice } from "@/components/was-price";
import { TrackProductView } from "@/components/analytics";
import { breadcrumbJsonLd, JsonLd, productJsonLd } from "@/components/json-ld";
import { priceTone } from "@/lib/pricing";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProducts()).find((p) => p.slug === slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: `${product.name}, ${priceText(product)}. ${product.category.name} at ${site.name}, Nairobi.`,
    alternates: { canonical: productHref(product.slug) },
    openGraph: { url: productHref(product.slug), ...((product.photo ?? product.boxPhoto) && { images: [(product.photo ?? product.boxPhoto)!.src] }) },
  };
}

/** The first sentence or so of the description, for the summary beside the photos. */
function summaryOf(description: string | null) {
  if (!description) return null;
  const text = description.replace(/\s+/g, " ").trim();
  const sentence = text.match(/^.{40,180}?[.!?](\s|$)/)?.[0].trim();
  return sentence ?? (text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text);
}

function PromoBanner({ product }: { product: Product }) {
  return (
    <Link
      href={productHref(product.slug)}
      className="tile relative flex min-h-[170px] flex-col gap-1 overflow-hidden bg-tint px-[22px] py-6"
    >
      <strong className="relative z-10 text-base font-medium text-brand">{priceText(product)}</strong>
      <span className="relative z-10 line-clamp-3 max-w-[58%] text-xl leading-tight font-light">
        {product.shortName ?? product.name}
      </span>
      <span className="relative z-10 mt-auto text-xs font-medium uppercase">Buy now ›</span>
      {product.photo && (
        <span className="absolute right-2 bottom-2 h-[72%] w-[44%]">
          <Image src={product.photo.src} alt="" fill sizes="120px" className="object-contain mix-blend-multiply" />
        </span>
      )}
    </Link>
  );
}

function ProductRow({ title, items }: { title: string; items: Product[] }) {
  return (
    <section className="reveal flex flex-col gap-[26px]">
      <SideTitle>{title}</SideTitle>
      <div className="cg-side one-row grid gap-y-[30px]">
        {items.map((item, i) => (
          <ProductCard key={item.slug} product={item} index={i} />
        ))}
      </div>
    </section>
  );
}

async function ProductDetails({ params }: { params: Params }) {
  const { slug } = await params;
  const [products, categories, settings, allReviews, delivery] = await Promise.all([getProducts(), getCategories(), getShopSettings(), getReviews(), getDelivery()]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const reviews = summarise(allReviews.filter((r) => r.productSlug === slug));

  const others = products.filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category.slug === product.category.slug);
  const elsewhere = others.filter((p) => p.category.slug !== product.category.slug && p.photo);
  // A stable mix of other departments, different for each product.
  const offset = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(1, elsewhere.length);
  const alsoLike = [...elsewhere.slice(offset), ...elsewhere.slice(0, offset)].slice(0, 5);

  const banners = others.filter((p) => p.showInBanner && p.photo).slice(0, 2);
  const latest = others.filter((p) => p.inStock).slice(0, 4);
  const summary = summaryOf(product.description);

  const specs = [
    ["Brand", product.brand],
    ["Model", product.name],
    ["Category", product.category.name],
    ["Warranty", product.warranty],
    ["Availability", product.inStock ? "In stock" : "Sold out"],
  ].filter((row): row is [string, string] => !!row[1]);

  const panel = "fade-up border border-t-0 border-line px-8 py-7 max-md:px-5 max-md:py-5";

  return (
    <div className="mx-auto w-full max-w-[1860px] px-6 pt-[22px] pb-20 max-sm:px-4 max-sm:pt-4 max-sm:pb-14">
      <JsonLd data={productJsonLd(product, shippingRate(delivery), reviews)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: product.category.name, path: categoryHref(product.category.slug) },
          { name: product.name, path: productHref(product.slug) },
        ])}
      />
      <TrackProductView
        item={{ id: product.slug, name: product.name, priceKes: product.priceKes, brand: product.brand, category: product.category.name }}
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 border-b border-line pb-[22px] text-[13px] max-sm:pb-3.5 max-sm:text-xs">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span aria-hidden="true">&gt;</span>
        <Link href={categoryHref(product.category.slug)} className="hover:text-brand">{product.category.name}</Link>
        <span aria-hidden="true">&gt;</span>
        <span className="text-muted">{product.name}</span>
      </nav>

      <div className="mt-[34px] flex flex-wrap items-start gap-[30px] max-sm:mt-5">
        <aside className="flex min-w-60 flex-[0_1_270px] flex-col gap-[30px] max-lg:order-last max-lg:flex-[1_1_100%]">
          {/* Phones and tablets reach every department from the header menu. */}
          <section className="max-lg:hidden">
            <SideTitle>Product categories</SideTitle>
            <nav aria-label="Product categories" className="flex flex-col border border-line px-[22px] py-[18px]">
              {categories.map((category) => {
                const active = category.slug === product.category.slug;
                return (
                  <Link
                    key={category.slug}
                    href={categoryHref(category.slug)}
                    aria-current={active ? "true" : undefined}
                    className={`py-2 text-[13px] transition-colors hover:text-brand ${active ? "font-medium text-brand" : ""}`}
                  >
                    {category.name}
                  </Link>
                );
              })}
              <Link href="/shop" className="py-2 text-[13px] text-[#15803d] hover:underline">View all »</Link>
            </nav>
          </section>

          {banners.length > 0 && (
            <div className="flex flex-col gap-5 max-lg:hidden">
              {banners.map((banner) => (
                <PromoBanner key={banner.slug} product={banner} />
              ))}
            </div>
          )}

          {latest.length > 0 && (
            <section className="max-lg:hidden">
              <SideTitle>Latest products</SideTitle>
              <div className="border border-b-0 border-line">
                {latest.map((item) => (
                  <ProductCardMini key={item.slug} product={item} />
                ))}
              </div>
            </section>
          )}

          <ServiceList />
        </aside>

        <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-[50px] max-sm:gap-9">
          <section className="fade-up flex flex-wrap items-start gap-[30px] max-sm:gap-5">
            <div className="flex min-w-0 max-w-[620px] flex-[1_1_420px]">
              <ProductGallery product={product} />
            </div>

            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <h1 className="text-[26px] leading-tight font-medium text-brand max-sm:text-[22px]">{product.name}</h1>
              {reviews.count > 0 && (
                <a href="#product-info" className="flex items-center gap-2 text-[13px] text-muted hover:text-brand">
                  <Stars rating={reviews.average} className="size-3.5" />
                  {reviews.average.toFixed(1)} · {reviews.count} {reviews.count === 1 ? "review" : "reviews"}
                </a>
              )}
              {summary ? (
                <p className="text-sm leading-relaxed text-body">
                  – {summary}{" "}
                  <a href="#product-info" className="whitespace-nowrap text-muted hover:text-brand">View more »</a>
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-body">
                  {product.brand && <li>– Brand: {product.brand}</li>}
                  {product.warranty && <li>– {product.warranty}</li>}
                </ul>
              )}

              <strong className={`mt-1 text-[26px] font-medium ${priceTone(product)}`}>
                {priceText(product)}
              </strong>
              <WasPrice product={product} />
              <span className={`inline-flex items-center gap-2 text-[13px] ${product.inStock ? "text-[#15803d]" : "text-muted"}`}>
                <span className={`size-2 rounded-full ${product.inStock ? "bg-[#15803d]" : "bg-muted"}`} />
                {product.inStock ? "In stock" : "Sold out"}
              </span>

              <div className="flex max-w-[360px] flex-col gap-[18px] pt-2 max-lg:max-w-none">
                <BuyBox product={product} />
              </div>

              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4 text-[13px] text-body">
                <span className="flex items-center gap-2.5">
                  <TruckIcon className="size-4 text-brand" strokeWidth={2} /> Same-day delivery within Nairobi
                </span>
                <span className="flex items-center gap-2.5">
                  <PhoneIcon className="size-4 text-brand" strokeWidth={2} /> Pay with M-Pesa or cash on delivery
                </span>
                <span>
                  Category:{" "}
                  <Link href={categoryHref(product.category.slug)} className="text-brand">{product.category.name}</Link>
                </span>
              </div>
            </div>
          </section>

          <section id="product-info" className="reveal scroll-mt-6">
            <ProductTabs
              variant="filled"
              label="Product information"
              tabs={[
                {
                  id: "description",
                  label: "Description",
                  content: (
                    <div className={panel}>
                      <h2 className="mb-2.5 text-lg font-medium">Product description</h2>
                      <div className="max-w-3xl">
                        <ReadMore
                          text={
                            product.description ??
                            `Full details for the ${product.name} are coming soon. Need to know something now? Call or message us on ${site.phone} and we'll help.`
                          }
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  id: "specifications",
                  label: "Specifications",
                  content: (
                    <table className="fade-up w-full border border-t-0 border-line text-sm">
                      <tbody>
                        {specs.map(([key, value]) => (
                          <tr key={key} className="border-b border-line last:border-b-0">
                            <th scope="row" className="w-2/5 border-r border-line px-5 py-4 text-left text-xs font-medium uppercase max-sm:px-3 max-sm:py-3">{key}</th>
                            <td className="px-5 py-4 text-body max-sm:px-3 max-sm:py-3">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ),
                },
                {
                  id: "reviews",
                  label: reviews.count ? `Reviews (${reviews.count})` : "Reviews",
                  content: (
                    <div className={panel}>
                      <h2 className="mb-4 text-lg font-medium">Customer reviews</h2>
                      <ProductReviews productSlug={product.slug} summary={reviews} />
                    </div>
                  ),
                },
                {
                  id: "delivery",
                  label: "Delivery & payment",
                  content: (
                    <div className={`${panel} grid gap-6 text-sm text-body sm:grid-cols-2`}>
                      <div className="flex flex-col gap-1.5">
                        <h2 className="mb-1 text-base font-medium text-text">Delivery</h2>
                        <span>✓ Same day within Nairobi</span>
                        <span>✓ Countrywide by courier</span>
                        <span>✓ Pick up {settings.address ? `at ${settings.address}, Nairobi` : "from our Nairobi shop"}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h2 className="mb-1 text-base font-medium text-text">Payment</h2>
                        <span>✓ Lipa na M-Pesa</span>
                        <span>✓ Cash on delivery in Nairobi</span>
                        <span>✓ Questions? Call {site.phone}</span>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </section>

          {sameCategory.length > 0 && <ProductRow title={`More in ${product.category.name}`} items={sameCategory.slice(0, 5)} />}
          {alsoLike.length > 0 && <ProductRow title="You may also like" items={alsoLike} />}
        </main>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1860px] flex-1 px-6 py-24 text-center text-muted">Loading product…</main>
      }
    >
      <ProductDetails params={params} />
    </Suspense>
  );
}
