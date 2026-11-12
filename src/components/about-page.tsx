import Image from "next/image";
import Link from "next/link";
import { breadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { PageHeading } from "@/components/page-heading";
import { mapEmbedUrl, shopPlace, site, whatsappLink } from "@/config/site";
import { getProducts, getShopSettings } from "@/lib/catalog";
import { SITE_PAGES } from "@/lib/site-pages";

const WELCOME =
  "Sky254 Electronics is an electronics shop in Nairobi. We sell phones, TVs, fridges, sound systems, CCTV and accessories from the brands Kenyans trust, and we deliver across the country.";

const REASONS = [
  { title: "Genuine products only", body: "Everything we sell is new and sealed, with the manufacturer's official warranty." },
  { title: "Fair, clear prices", body: "Prices are in Kenya shillings, and the price you see is the price you pay." },
  { title: "Pay the way that suits you", body: "Pay with M-Pesa, or in cash when your order arrives or when you collect it from the shop." },
  { title: "Delivery across Kenya", body: "Nairobi orders usually arrive the same day or the next day, and the rest of the country in 1 to 3 days." },
  { title: "Real people to talk to", body: "Call or WhatsApp us before you buy, and after. We'll help you choose and look after your warranty." },
];

/**
 * The About page: a welcome band, a "Why choose us?" accordion, a map and the shop's
 * contact details, then the brands we stock. The wording is part of the site; the
 * address, hours and email come from Shop settings.
 */
export async function AboutPage() {
  const [settings, products] = await Promise.all([getShopSettings(), getProducts()]);
  const { path, title } = SITE_PAGES.about;

  // Photos come from the shop's own products: a hero product first, then another one.
  const live = products.filter((p) => p.inStock && p.photo);
  const heroPhoto = (live.find((p) => p.showInHero) ?? live.find((p) => p.isFeatured) ?? live[0])?.photo ?? null;
  const sidePhoto = live.find((p) => p.showInBanner && p.photo !== heroPhoto)?.photo ?? live.find((p) => p.photo !== heroPhoto)?.photo ?? null;

  // The brands with the most products in stock.
  const brandCounts = new Map<string, number>();
  for (const p of products) if (p.inStock && p.brand?.trim()) brandCounts.set(p.brand.trim(), (brandCounts.get(p.brand.trim()) ?? 0) + 1);
  const brands = [...brandCounts].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);

  const place = shopPlace(settings.address);
  const whatsapp = whatsappLink("Hi Sky254!");
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: title, path }])} />
      <PageHeading title={title} />

      <main className="pb-16">
        {/* Welcome band */}
        <section aria-labelledby="welcome-h" className="relative mt-px overflow-hidden bg-[#f5f6f9]">
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-6 px-6 max-sm:px-4 py-12 md:grid-cols-[260px_1fr_260px] md:py-16">
            {heroPhoto ? (
              <span className="relative mx-auto block aspect-square w-44 md:w-full">
                <Image src={heroPhoto.src} alt="" fill sizes="260px" priority className="object-contain mix-blend-multiply" />
              </span>
            ) : (
              <span className="max-md:hidden" />
            )}
            <div className="flex flex-col items-center gap-4 text-center">
              <h2 id="welcome-h" className="text-[28px] leading-tight font-bold text-ink md:text-[34px]">
                Welcome to {site.name}
              </h2>
              <p className="max-w-[620px] text-base leading-[1.75] text-body">{WELCOME}</p>
            </div>
            <span className="max-md:hidden" />
          </div>
        </section>

        {/* Photo and "Why choose us?" */}
        <section aria-labelledby="why-h" className="mx-auto grid w-full max-w-[1240px] items-start gap-9 px-6 max-sm:px-4 pt-12 lg:grid-cols-2">
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#eceef3]">
            {sidePhoto ? (
              <Image src={sidePhoto.src} alt={sidePhoto.alt} fill sizes="(max-width: 1024px) 100vw, 580px" className="object-contain p-10 mix-blend-multiply" />
            ) : (
              <span className="text-2xl font-bold text-muted">{site.name}</span>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <h2 id="why-h" className="text-[22px] font-medium text-text">Why choose us?</h2>
            <div className="flex flex-col gap-4">
              {REASONS.map((reason, i) => (
                <details
                  key={reason.title}
                  name="why-choose-us"
                  open={i === 0}
                  className="group border border-line bg-white open:border-l-[3px] open:border-l-brand"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-[15px] font-medium text-text marker:hidden hover:text-brand">
                    {reason.title}
                    <span aria-hidden className="relative size-3.5 shrink-0 text-brand">
                      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-current" />
                      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
                    </span>
                  </summary>
                  <p className="border-t border-line px-5 py-4 text-[15px] leading-relaxed text-body">{reason.body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Map */}
        <section aria-labelledby="visit-h" className="mx-auto w-full max-w-[1240px] px-6 max-sm:px-4 pt-12">
          <h2 id="visit-h" className="sr-only">Visit us</h2>
          <iframe
            title={`Map showing ${site.name}`}
            src={mapEmbedUrl(settings.address)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[320px] w-full border-0 bg-[#eceef3] md:h-[420px]"
          />

          <div className="grid gap-8 pt-9 text-center sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <h3 className="mb-1.5 text-xl font-medium text-text">Visit the shop</h3>
              <p className="text-[15px] text-body">{place}</p>
              {settings.hours && <p className="text-[15px] text-body">{settings.hours}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="mb-1.5 text-xl font-medium text-text">Call or WhatsApp</h3>
              <p className="text-[15px] text-body">
                Phone: <a href={tel} className="hover:text-brand">{site.phone}</a>
              </p>
              {whatsapp && (
                <p className="text-[15px] text-body">
                  <a href={whatsapp} className="hover:text-brand">Message us on WhatsApp</a>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="mb-1.5 text-xl font-medium text-text">Write to us</h3>
              {settings.email && (
                <p className="text-[15px] text-body">
                  Email: <a href={`mailto:${settings.email}`} className="hover:text-brand">{settings.email}</a>
                </p>
              )}
              <p className="text-[15px] text-body">
                <Link href="/contact" className="hover:text-brand">Send us a message</Link>
              </p>
            </div>
          </div>
        </section>

        {/* Brands */}
        {brands.length > 0 && (
          <section aria-label="Brands we stock" className="mx-auto w-full max-w-[1240px] px-6 max-sm:px-4 pt-12">
            <ul className="grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {brands.map((brand) => (
                <li key={brand} className="text-center">
                  <Link
                    href={`/shop?q=${encodeURIComponent(brand)}`}
                    className="inline-block text-xl font-bold tracking-wide text-[#a3a8b3] uppercase italic transition-colors hover:text-brand"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
