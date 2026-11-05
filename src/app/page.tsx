import Image from "next/image";
import Link from "next/link";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { ProductTabs } from "@/components/home/product-tabs";
import { ChevronRightIcon } from "@/components/icons";
import { ProductCard, ProductCardMini, ProductCardRow } from "@/components/product-card";
import { ServiceList } from "@/components/service-list";
import { site } from "@/config/site";
import { getCategories, getProducts } from "@/lib/catalog";
import { categoryHref, formatKes, priceText, productHref, type Product } from "@/lib/types";

const TABS = {
  new: [
    "samsung-galaxy-s26-ultra-8gb-256gb", "samsung-galaxy-a57-5g-8gb-256gb", "samsung-galaxy-a17-4gb-128gb",
    "tcl-55-inch-v6d-4k-google-tv", "hisense-203l-double-door-fridge", "imou-cue-2-3mp-wi-fi-camera",
    "dahua-cube-a1-3mp-wi-fi-camera", "tenda-tx2-pro-wi-fi-6-router", "sonar-b7c-3-tap-water-dispenser",
    "18-inch-led-ring-light-kit",
  ],
  picks: [
    "samsung-galaxy-a56-5g-8gb-256gb", "samsung-galaxy-a26-5g-8gb-256gb", "hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv",
    "tcl-43-inch-s5k-qled-google-tv", "lg-234l-top-freezer-fridge", "hisense-154l-double-door-fridge",
    "dahua-4-channel-wizsense-dvr", "hp-65w-usb-c-laptop-charger", "h-and-f-hf-f226-wireless-speaker",
    "geemy-gm-6008-hair-clipper",
  ],
};

const FEATURED = [
  "samsung-galaxy-a17-4gb-128gb", "samsung-galaxy-a07-4gb-128gb", "tcl-50-inch-v6d-4k-google-tv",
  "hisense-154l-double-door-fridge", "dahua-2mp-dual-light-bullet-camera",
];

const SECTIONS = [
  {
    title: "Phones",
    categories: ["smartphones", "feature-phones", "chargers-and-cables"],
    products: [
      "samsung-galaxy-s25-ultra-256gb", "samsung-galaxy-a56-5g-8gb-256gb", "samsung-galaxy-a26-5g-8gb-256gb",
      "samsung-galaxy-a16-4gb-128gb", "samsung-galaxy-a07-4gb-128gb", "nokia-105-4g-dual-sim",
    ],
  },
  {
    title: "TVs & home appliances",
    categories: ["smart-tvs", "fridges", "kitchen", "tv-wall-mounts"],
    products: [
      "hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv", "tcl-50-inch-v6d-4k-google-tv", "tcl-43-inch-s5k-qled-google-tv",
      "lg-234l-top-freezer-fridge", "hisense-154l-double-door-fridge", "sonar-b7c-3-tap-water-dispenser",
    ],
  },
  {
    title: "Audio, lighting & security",
    categories: ["audio", "lighting", "cctv-and-security"],
    products: [
      "h-and-f-hf-f226-wireless-speaker", "portable-speaker-898", "wireless-speaker-gu-195",
      "10-inch-ring-fill-light-stand", "dahua-4-channel-wizsense-dvr", "dahua-2mp-dual-light-eyeball-camera",
    ],
  },
];

const MORE = [
  "samsung-galaxy-a57-5g-8gb-256gb", "tcl-55-inch-v6d-4k-google-tv", "imou-cue-2-3mp-wi-fi-camera",
  "hisense-203l-double-door-fridge", "35w-usb-c-charger-2m-cable", "tenda-tx2-pro-wi-fi-6-router",
  "lg-234l-top-freezer-fridge", "samsung-galaxy-a17-4gb-128gb",
];

const BRANDS = ["SAMSUNG", "Hisense", "TCL", "LG", "dahua", "imou", "Tenda", "NOKIA", "HP"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-line pb-3.5 text-base font-medium">{children}</h2>;
}

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  // Anything hidden or removed in the database simply drops out of the page.
  const pick = (slugs: string[]) => slugs.flatMap((slug) => bySlug.get(slug) ?? []);
  // Links to a category only appear while it has something in stock.
  const hasStock = (slug: string) => categories.some((c) => c.slug === slug);
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const cheapest = (slug: string) => {
    const prices = products.flatMap((p) => (p.category.slug === slug && p.priceKes != null ? p.priceKes : []));
    return prices.length ? `from ${formatKes(Math.min(...prices))}` : "in stock";
  };
  const under3000 = products
    .filter((p): p is Product & { priceKes: number } => p.priceKes != null && p.priceKes < 3000 && !!p.photo)
    .slice(0, 10);

  const hero = (slug: string, label: string, title: string, strong: string): HeroSlide[] => {
    const p = bySlug.get(slug);
    const image = p?.photo;
    return p && image ? [{ label, title, strong, price: priceText(p), href: productHref(slug), image }] : [];
  };
  const slides = [
    ...hero("samsung-galaxy-s26-ultra-8gb-256gb", "Smartphones", "Galaxy", "S26 Ultra"),
    ...hero("hisense-55-inch-a6q-4k-uhd-vidaa-smart-tv", "Smart TVs", 'Hisense 55"', "4K VIDAA"),
    ...hero("lg-234l-top-freezer-fridge", "Fridges", "LG 234L", "Top Freezer"),
  ];

  const tiles = [
    { label: "Fridges", a: "Up to", b: "10-year", c: "warranty", category: "fridges", slug: "hisense-203l-double-door-fridge" },
    { label: "Smart TVs", a: "TCL & Hisense", b: cheapest("smart-tvs"), c: "", category: "smart-tvs", slug: "tcl-43-inch-s5k-qled-google-tv" },
    { label: "Security", a: "CCTV", b: cheapest("cctv-and-security"), c: "", category: "cctv-and-security", slug: "dahua-cube-a1-3mp-wi-fi-camera" },
    { label: "Networking", a: "Tenda", b: "Wi-Fi 6", c: "router", category: "networking", slug: "tenda-tx2-pro-wi-fi-6-router" },
  ];
  const topCategories = [
    { slug: "smartphones", product: "samsung-galaxy-a56-5g-8gb-256gb" },
    { slug: "feature-phones", product: "nokia-105-4g-dual-sim" },
    { slug: "smart-tvs", product: "tcl-55-inch-v6d-4k-google-tv" },
    { slug: "fridges", product: "lg-234l-top-freezer-fridge" },
    { slug: "cctv-and-security", product: "imou-cue-2-3mp-wi-fi-camera" },
    { slug: "chargers-and-cables", product: "35w-usb-c-charger-2m-cable" },
  ];
  const banners = [
    { slug: "samsung-galaxy-s25-ultra-256gb", a: "Galaxy", b: "S25 Ultra" },
    { slug: "tcl-50-inch-v6d-4k-google-tv", a: 'TCL 50"', b: "4K Google TV" },
    { slug: "imou-cue-2-3mp-wi-fi-camera", a: "Imou", b: "Cue 2 Camera" },
  ];
  const a57 = bySlug.get("samsung-galaxy-a57-5g-8gb-256gb");
  const shopPhoto = bySlug.get("lg-234l-top-freezer-fridge")?.boxPhoto;

  const grid = (items: Product[], layout: string) => (
    <div className={`grid gap-y-[30px] ${layout}`}>
      {items.map((product, i) => (
        <ProductCard key={product.slug} product={product} index={i} />
      ))}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1860px] flex-col gap-[50px] px-6 pb-20">
      <h1 className="sr-only">Sky254 Electronics: phones, TVs, fridges and CCTV in Nairobi</h1>

      <section className="fade-up flex flex-wrap items-start gap-[30px]">
        <nav aria-label="Departments" className="min-w-60 flex-[0_1_270px] border border-t-0 border-line py-2.5 max-lg:hidden">
          {categories.map((category, i) => (
            <Link
              key={category.slug}
              href={categoryHref(category.slug)}
              className="flex items-center gap-3.5 px-[22px] py-[9px] text-[13px] transition-colors hover:text-brand"
            >
              <span className={`size-1.5 rounded-[1px] ${i % 2 === 0 ? "bg-brand" : "bg-[#c5cbd6]"}`} />
              <span className="flex-1">{category.name}</span>
              <ChevronRightIcon className="size-2.5 text-muted" strokeWidth={2.5} />
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 flex-[999_1_640px] flex-wrap gap-5">
          <HeroSlider slides={slides} />
          <div className="grid min-w-0 flex-[1_1_400px] grid-cols-2 gap-5">
            {tiles.filter((tile) => hasStock(tile.category)).map((tile) => {
              const image = bySlug.get(tile.slug)?.photo;
              return (
                <Link
                  key={tile.label}
                  href={categoryHref(tile.category)}
                  className="tile relative flex min-h-[200px] flex-col gap-1 overflow-hidden bg-tint p-[22px]"
                >
                  <span className="relative z-10 text-xs text-brand">{tile.label}</span>
                  <span className="relative z-10 max-w-[58%] text-base leading-snug font-light">
                    {tile.a} <strong className="font-medium">{tile.b}</strong> {tile.c}
                  </span>
                  {image && (
                    <span className="absolute right-2.5 bottom-2.5 h-[62%] w-[42%]">
                      <Image src={image.src} alt="" fill sizes="220px" className="object-contain mix-blend-multiply" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reveal flex flex-wrap items-stretch gap-[30px]">
        {a57?.photo && (
          <Link
            href={productHref(a57.slug)}
            className="tile relative flex min-h-[230px] min-w-60 flex-[0_1_270px] flex-col gap-1 overflow-hidden bg-tint px-6 py-[30px]"
          >
            <span className="relative z-10 text-2xl leading-tight font-light">Galaxy A57 5G</span>
            <strong className="relative z-10 text-xl font-medium text-brand">{priceText(a57)}</strong>
            <span className="relative z-10 mt-[18px] text-xs font-medium uppercase">Buy now ›</span>
            <span className="absolute right-1.5 bottom-2 h-[62%] w-[42%]">
              <Image src={a57.photo.src} alt={a57.photo.alt} fill sizes="130px" className="object-contain mix-blend-multiply" />
            </span>
          </Link>
        )}
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[22px]">
          <SectionTitle>Top categories</SectionTitle>
          <div className="cat6 grid gap-5">
            {topCategories.filter((item) => hasStock(item.slug)).map((item) => {
              const image = bySlug.get(item.product)?.photo;
              return (
                <Link
                  key={item.slug}
                  href={categoryHref(item.slug)}
                  className="tile flex flex-col items-center gap-3.5 bg-tint px-3 pt-5 pb-[18px]"
                >
                  <span className="relative h-[100px] w-full">
                    {image && <Image src={image.src} alt="" fill sizes="240px" className="object-contain mix-blend-multiply" />}
                  </span>
                  <span className="text-center text-xs">{categoryName(item.slug)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="reveal flex flex-wrap items-start gap-[30px]">
        <aside className="flex min-w-60 flex-[0_1_270px] flex-col gap-10">
          <div>
            <h2 className="mb-[18px] text-base font-medium">Latest products</h2>
            <div className="border border-b-0 border-line">
              {pick(TABS.new.slice(0, 5)).map((product) => (
                <ProductCardMini key={product.slug} product={product} />
              ))}
            </div>
          </div>
          <ServiceList />
        </aside>

        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-[30px]">
          <ProductTabs
            tabs={[
              { id: "new", label: "New arrivals", content: grid(pick(TABS.new), "cg-side two-rows") },
              { id: "picks", label: "Top picks", content: grid(pick(TABS.picks), "cg-side two-rows") },
              { id: "under", label: "Under KSh 3,000", content: grid(under3000, "cg-side two-rows") },
            ]}
          />
          <div className="mt-5">
            <SectionTitle>Featured products</SectionTitle>
          </div>
          {grid(pick(FEATURED), "cg-side one-row")}
        </div>
      </section>

      <section className="reveal grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[30px]">
        {banners.flatMap((banner) => {
          const product = bySlug.get(banner.slug);
          if (!product?.photo) return [];
          return (
            <Link
              key={banner.slug}
              href={productHref(banner.slug)}
              className="tile relative flex min-h-[190px] flex-col gap-2 overflow-hidden bg-tint px-6 py-[26px]"
            >
              <span className="relative z-10 text-sm text-brand">{priceText(product)}</span>
              <span className="relative z-10 max-w-[55%] text-[22px] leading-tight font-light">
                {banner.a} <strong className="font-medium">{banner.b}</strong>
              </span>
              <span className="relative z-10 mt-auto inline-flex h-8 items-center self-start rounded-full border-2 border-brand px-[22px] text-[11px] font-medium text-brand uppercase">
                Buy now
              </span>
              <span className="absolute right-3.5 bottom-3.5 h-[82%] w-[42%]">
                <Image src={product.photo.src} alt="" fill sizes="240px" className="object-contain mix-blend-multiply" />
              </span>
            </Link>
          );
        })}
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="reveal flex flex-col gap-[30px]">
          <div className="flex flex-wrap items-center justify-between gap-x-[30px] gap-y-3 border-b border-line pb-3.5">
            <h2 className="text-base font-medium">{section.title}</h2>
            <div className="flex flex-wrap gap-[26px] text-[13px]">
              {section.categories.filter(hasStock).map((slug) => (
                <Link key={slug} href={categoryHref(slug)} className="text-muted transition-colors hover:text-brand">
                  {categoryName(slug)}
                </Link>
              ))}
            </div>
          </div>
          {grid(pick(section.products), "cg-full one-row")}
        </section>
      ))}

      <section className="reveal flex flex-wrap items-start gap-[30px]">
        <aside className="flex min-w-60 flex-[0_1_270px] flex-col gap-[18px]">
          <SectionTitle>Visit our shop</SectionTitle>
          <div className="flex flex-col gap-3 border border-line p-3.5">
            {shopPhoto && (
              <span className="relative aspect-[4/3] w-full overflow-hidden">
                <Image src={shopPhoto.src} alt="Inside the Sky254 shop" fill sizes="270px" className="object-cover" />
              </span>
            )}
            <span className="text-xs text-brand">Nairobi</span>
            <strong className="text-[15px] leading-snug font-medium">Come see it in the box before you buy</strong>
            <span className="text-[13px] leading-relaxed text-muted">
              {site.address} · {site.hours}
            </span>
          </div>
        </aside>
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-[30px]">
          <SectionTitle>More from the shop</SectionTitle>
          <div className="cg-rows grid gap-x-[30px] gap-y-5">
            {pick(MORE).map((product) => (
              <ProductCardRow key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Brands we stock" className="reveal flex flex-wrap items-center justify-around gap-x-10 gap-y-6 border border-line px-5 py-[34px]">
        {BRANDS.map((brand) => (
          <span key={brand} className="text-2xl font-medium tracking-tight text-[#7c8594]">{brand}</span>
        ))}
      </section>
    </main>
  );
}
