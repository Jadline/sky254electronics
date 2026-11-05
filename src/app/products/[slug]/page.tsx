import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductTabs } from "@/components/home/product-tabs";
import { PhoneIcon, TruckIcon } from "@/components/icons";
import { BuyBox } from "@/components/product/buy-box";
import { ProductGallery } from "@/components/product/gallery";
import { ProductCard } from "@/components/product-card";
import { site } from "@/config/site";
import { getProducts } from "@/lib/catalog";
import { categoryHref, priceText } from "@/lib/types";

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
    openGraph: product.photo ? { images: [product.photo.src] } : undefined,
  };
}

function InfoBox({ title, Icon, lines }: { title: string; Icon: typeof TruckIcon; lines: string[] }) {
  return (
    <div className="flex flex-col gap-2.5 bg-tint px-[22px] py-5">
      <strong className="flex items-center gap-2.5 text-[15px] font-medium">
        <span className="flex size-[30px] items-center justify-center rounded-full bg-brand text-white">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        {title}
      </strong>
      {lines.map((line) => (
        <span key={line} className="text-[13px] text-body">✓ {line}</span>
      ))}
    </div>
  );
}

async function ProductDetails({ params }: { params: Params }) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const sameCategory = products.filter((p) => p.category.slug === product.category.slug && p.slug !== slug);
  const others = products.filter((p) => p.category.slug !== product.category.slug && p.photo);
  // A stable mix of other departments, different for each product.
  const offset = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(1, others.length);
  const alsoLike = [...others.slice(offset), ...others.slice(0, offset)].slice(0, 6);

  const specs = [
    ["Brand", product.brand],
    ["Model", product.name],
    ["Category", product.category.name],
    ["Warranty", product.warranty],
    ["Availability", product.inStock ? "In stock" : "Sold out"],
  ].filter((row): row is [string, string] => !!row[1]);

  return (
    <main className="mx-auto flex w-full max-w-[1860px] flex-col gap-[50px] px-6 pt-[22px] pb-20">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 text-[13px]">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span aria-hidden="true">&gt;</span>
        <Link href={categoryHref(product.category.slug)} className="hover:text-brand">{product.category.name}</Link>
        <span aria-hidden="true">&gt;</span>
        <span className="text-muted">{product.name}</span>
      </nav>

      <section className="fade-up flex flex-wrap items-start gap-[30px]">
        <ProductGallery product={product} />

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <h1 className="text-[26px] leading-tight font-medium text-brand">{product.name}</h1>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-body">
            {product.brand && <li>– Brand: {product.brand}</li>}
            {product.warranty && <li>– {product.warranty}</li>}
            <li>– Pay with M-Pesa, card or cash on delivery</li>
          </ul>
          <div className="h-px bg-line" />
          <span className="text-sm text-body">
            Category:{" "}
            <Link href={categoryHref(product.category.slug)} className="text-brand">{product.category.name}</Link>
          </span>
          <div className="mt-3.5">
            <InfoBox
              title="Delivery"
              Icon={TruckIcon}
              lines={["Same day within Nairobi", "Countrywide by courier", `Pick up at ${site.address}, Nairobi`]}
            />
          </div>
        </div>

        <div className="flex min-w-60 flex-[0_1_270px] flex-col gap-[18px] max-lg:flex-[1_1_100%]">
          <strong className={`text-[26px] font-medium ${product.priceKes == null ? "text-muted" : "text-brand"}`}>
            {priceText(product)}
          </strong>
          <span className={`inline-flex items-center gap-2 text-[13px] ${product.inStock ? "text-[#15803d]" : "text-muted"}`}>
            <span className={`size-2 rounded-full ${product.inStock ? "bg-[#15803d]" : "bg-muted"}`} />
            {product.inStock ? "In stock" : "Sold out"}
          </span>
          <BuyBox product={product} />
          <InfoBox title="Pay your way" Icon={PhoneIcon} lines={["Lipa na M-Pesa", "Visa or Mastercard", "Cash on delivery in Nairobi"]} />
        </div>
      </section>

      <section className="reveal">
        <ProductTabs
          variant="filled"
          label="Product information"
          tabs={[
            {
              id: "description",
              label: "Description",
              content: (
                <div className="fade-up border border-t-0 border-line px-[60px] py-10 max-md:px-6">
                  <h2 className="mb-3 text-[22px] font-medium">Product description</h2>
                  <p className="max-w-3xl text-sm leading-[1.8] text-body">
                    {product.description ??
                      `Full details for the ${product.name} are coming soon. Need to know something now? Call or message us on ${site.phone} and we'll help.`}
                  </p>
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
                      <tr key={key} className="border-b border-line">
                        <th scope="row" className="w-2/5 border-r border-line px-4 py-[18px] text-left font-medium uppercase">{key}</th>
                        <td className="px-4 py-[18px] text-body">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ),
            },
          ]}
        />
      </section>

      {[
        { title: `More in ${product.category.name}`, items: sameCategory.slice(0, 6) },
        { title: "You may also like", items: alsoLike },
      ]
        .filter((row) => row.items.length > 0)
        .map((row) => (
          <section key={row.title} className="reveal flex flex-col gap-[30px]">
            <h2 className="border-b border-line pb-3.5 text-base font-medium">{row.title}</h2>
            <div className="cg-full grid gap-y-[30px]">
              {row.items.map((item, i) => (
                <ProductCard key={item.slug} product={item} index={i} />
              ))}
            </div>
          </section>
        ))}
    </main>
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
