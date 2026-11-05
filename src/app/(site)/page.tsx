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

// Everything below is chosen from live data. These lists only decide the layout:
// which departments go in which block, and in what order.
const TILE_CATEGORIES = ["fridges", "smart-tvs", "cctv-and-security", "networking"];
const TOP_CATEGORIES = ["smartphones", "feature-phones", "smart-tvs", "fridges", "cctv-and-security", "chargers-and-cables"];
const SECTIONS = [
  { title: "Phones", categories: ["smartphones", "feature-phones", "chargers-and-cables"] },
  { title: "TVs & home appliances", categories: ["smart-tvs", "fridges", "kitchen", "home-appliances", "tv-wall-mounts"] },
  { title: "Audio, lighting & security", categories: ["audio", "lighting", "cctv-and-security"] },
];

/** Takes turns from each list, so a row shows a mix instead of one department. */
function roundRobin(lists: Product[][], limit: number) {
  const mixed: Product[] = [];
  for (let i = 0; mixed.length < limit && lists.some((list) => i < list.length); i++) {
    for (const list of lists) {
      if (i < list.length && mixed.length < limit) mixed.push(list[i]);
    }
  }
  return mixed;
}

/** "Galaxy S26 Ultra" becomes light "Galaxy" and bold "S26 Ultra". */
function splitTitle(product: Product) {
  const words = (product.shortName ?? product.name).split(" ");
  const middle = Math.floor(words.length / 2);
  return { light: words.slice(0, middle).join(" "), bold: words.slice(middle).join(" ") };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-line pb-3.5 text-base font-medium">{children}</h2>;
}

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Newest first. Sold-out products stay in the shop but not on the Home page.
  const live = products.filter((p) => p.inStock);
  const withPhoto = live.filter((p) => p.photo);
  const featured = live.filter((p) => p.isFeatured);
  const newest = live.slice(0, 10);
  const newestSlugs = new Set(newest.map((p) => p.slug));

  const inCategory = (slug: string) =>
    live.filter((p) => p.category.slug === slug).sort((a, b) => Number(!!b.photo) - Number(!!a.photo));
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const categoryPhoto = (slug: string) => withPhoto.find((p) => p.category.slug === slug)?.photo;
  const lowestPrice = (slug: string) => {
    const prices = inCategory(slug).flatMap((p) => p.priceKes ?? []);
    return prices.length ? `from ${formatKes(Math.min(...prices))}` : "in stock";
  };

  const slides: HeroSlide[] = withPhoto
    .filter((p) => p.showInHero && p.photo)
    .map((p) => {
      const { light, bold } = splitTitle(p);
      return { label: p.category.name, title: light, strong: bold, price: priceText(p), href: productHref(p.slug), image: p.photo! };
    });

  const banners = withPhoto.filter((p) => p.showInBanner);
  const [sideBanner, ...rowBanners] = banners;

  const under3000 = withPhoto.filter((p) => p.priceKes != null && p.priceKes < 3000).slice(0, 10);

  const tiles = TILE_CATEGORIES.filter((slug) => categoryPhoto(slug));
  const topCategories = TOP_CATEGORIES.filter((slug) => categoryPhoto(slug));

  const sections = SECTIONS.map((section) => ({
    ...section,
    categories: section.categories.filter((slug) => inCategory(slug).length > 0),
  }));
  // A department added later still gets a row, even before it's placed in a section.
  const placed = new Set(SECTIONS.flatMap((section) => section.categories));
  const others = categories.map((c) => c.slug).filter((slug) => !placed.has(slug) && inCategory(slug).length > 0);
  if (others.length > 0) sections.push({ title: "More departments", categories: others });

  const brandCounts = new Map<string, number>();
  live.forEach((p) => p.brand && brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1));
  const brands = [...brandCounts].sort((a, b) => b[1] - a[1]).slice(0, 9).map(([brand]) => brand);

  const more = withPhoto.filter((p) => !newestSlugs.has(p.slug)).slice(0, 8);
  const shopPhoto = products.find((p) => p.slug === "lg-234l-top-freezer-fridge")?.boxPhoto;

  const grid = (items: Product[], layout: string) => (
    <div className={`grid gap-y-[30px] ${layout}`}>
      {items.map((product, i) => (
        <ProductCard key={product.slug} product={product} index={i} />
      ))}
    </div>
  );

  const tabs = [
    { id: "new", label: "New arrivals", items: newest },
    { id: "picks", label: "Top picks", items: featured.slice(0, 10) },
    { id: "under", label: "Under KSh 3,000", items: under3000 },
  ].filter((tab) => tab.items.length > 0);
  const featuredRow = [...featured].reverse().slice(0, 5);

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
          {slides.length > 0 && <HeroSlider slides={slides} />}
          {tiles.length > 0 && (
            <div className="grid min-w-0 flex-[1_1_400px] grid-cols-2 gap-5">
              {tiles.map((slug) => {
                const image = categoryPhoto(slug);
                return (
                  <Link
                    key={slug}
                    href={categoryHref(slug)}
                    className="tile relative flex min-h-[200px] flex-col gap-1 overflow-hidden bg-tint p-[22px]"
                  >
                    <span className="relative z-10 text-xs text-brand">{categoryName(slug)}</span>
                    <span className="relative z-10 max-w-[58%] text-base leading-snug font-medium">{lowestPrice(slug)}</span>
                    {image && (
                      <span className="absolute right-2.5 bottom-2.5 h-[62%] w-[42%]">
                        <Image src={image.src} alt="" fill sizes="220px" className="object-contain mix-blend-multiply" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="reveal flex flex-wrap items-stretch gap-[30px]">
        {sideBanner?.photo && (
          <Link
            href={productHref(sideBanner.slug)}
            className="tile relative flex min-h-[230px] min-w-60 flex-[0_1_270px] flex-col gap-1 overflow-hidden bg-tint px-6 py-[30px]"
          >
            <span className="relative z-10 max-w-[75%] text-2xl leading-tight font-light">{sideBanner.shortName ?? sideBanner.name}</span>
            <strong className="relative z-10 text-xl font-medium text-brand">{priceText(sideBanner)}</strong>
            <span className="relative z-10 mt-[18px] text-xs font-medium uppercase">Buy now ›</span>
            <span className="absolute right-1.5 bottom-2 h-[62%] w-[42%]">
              <Image src={sideBanner.photo.src} alt={sideBanner.photo.alt} fill sizes="130px" className="object-contain mix-blend-multiply" />
            </span>
          </Link>
        )}
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[22px]">
          <SectionTitle>Top categories</SectionTitle>
          <div className="cat6 grid gap-5">
            {topCategories.map((slug) => {
              const image = categoryPhoto(slug);
              return (
                <Link key={slug} href={categoryHref(slug)} className="tile flex flex-col items-center gap-3.5 bg-tint px-3 pt-5 pb-[18px]">
                  <span className="relative h-[100px] w-full">
                    {image && <Image src={image.src} alt="" fill sizes="240px" className="object-contain mix-blend-multiply" />}
                  </span>
                  <span className="text-center text-xs">{categoryName(slug)}</span>
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
              {live.slice(0, 5).map((product) => (
                <ProductCardMini key={product.slug} product={product} />
              ))}
            </div>
          </div>
          <ServiceList />
        </aside>

        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-[30px]">
          <ProductTabs tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label, content: grid(tab.items, "cg-side two-rows") }))} />
          {featuredRow.length > 0 && (
            <>
              <div className="mt-5">
                <SectionTitle>Featured products</SectionTitle>
              </div>
              {grid(featuredRow, "cg-side one-row")}
            </>
          )}
        </div>
      </section>

      {rowBanners.length > 0 && (
        <section className="reveal grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[30px]">
          {rowBanners.map((product) => {
            const { light, bold } = splitTitle(product);
            return (
              <Link
                key={product.slug}
                href={productHref(product.slug)}
                className="tile relative flex min-h-[190px] flex-col gap-2 overflow-hidden bg-tint px-6 py-[26px]"
              >
                <span className="relative z-10 text-sm text-brand">{priceText(product)}</span>
                <span className="relative z-10 max-w-[55%] text-[22px] leading-tight font-light">
                  {light} <strong className="font-medium">{bold}</strong>
                </span>
                <span className="relative z-10 mt-auto inline-flex h-8 items-center self-start rounded-full border-2 border-brand px-[22px] text-[11px] font-medium text-brand uppercase">
                  Buy now
                </span>
                {product.photo && (
                  <span className="absolute right-3.5 bottom-3.5 h-[82%] w-[42%]">
                    <Image src={product.photo.src} alt="" fill sizes="240px" className="object-contain mix-blend-multiply" />
                  </span>
                )}
              </Link>
            );
          })}
        </section>
      )}

      {sections
        .filter((section) => section.categories.length > 0)
        .map((section) => (
          <section key={section.title} className="reveal flex flex-col gap-[30px]">
            <div className="flex flex-wrap items-center justify-between gap-x-[30px] gap-y-3 border-b border-line pb-3.5">
              <h2 className="text-base font-medium">{section.title}</h2>
              <div className="flex flex-wrap gap-[26px] text-[13px]">
                {section.categories.map((slug) => (
                  <Link key={slug} href={categoryHref(slug)} className="text-muted transition-colors hover:text-brand">
                    {categoryName(slug)}
                  </Link>
                ))}
              </div>
            </div>
            {grid(roundRobin(section.categories.map(inCategory), 6), "cg-full one-row")}
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
        {more.length > 0 && (
          <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-[30px]">
            <SectionTitle>More from the shop</SectionTitle>
            <div className="cg-rows grid gap-x-[30px] gap-y-5">
              {more.map((product) => (
                <ProductCardRow key={product.slug} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>

      {brands.length > 0 && (
        <section aria-label="Brands we stock" className="reveal flex flex-wrap items-center justify-around gap-x-10 gap-y-6 border border-line px-5 py-[34px]">
          {brands.map((brand) => (
            <span key={brand} className="text-2xl font-medium tracking-tight text-[#7c8594]">{brand}</span>
          ))}
        </section>
      )}
    </main>
  );
}
