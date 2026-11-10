import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { PageHeading } from "@/components/page-heading";
import { blocksToPlainText, faqPairs, RichText, blocksToSource } from "@/components/rich-text";
import { ServiceList } from "@/components/service-list";
import { SideTitle } from "@/components/side-title";
import { site, whatsappLink } from "@/config/site";
import { getShopSettings, getSitePage } from "@/lib/catalog";
import type { ShopSettings } from "@/lib/settings";
import { SITE_PAGES, type SitePageSlug } from "@/lib/site-pages";
import { formatKes } from "@/lib/types";

export async function infoPageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const page = await getSitePage(slug);
  return {
    title: page.title,
    description: page.description ?? undefined,
    alternates: { canonical: SITE_PAGES[slug].path },
  };
}

function ContactDetails({ settings }: { settings: ShopSettings }) {
  const whatsapp = whatsappLink("Hi Sky254!");
  const rows = [
    { label: "Phone", value: <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-brand hover:underline">{site.phone}</a> },
    whatsapp && { label: "WhatsApp", value: <a href={whatsapp} className="text-brand hover:underline">Message us on WhatsApp</a> },
    settings.email && { label: "Email", value: <a href={`mailto:${settings.email}`} className="text-brand hover:underline">{settings.email}</a> },
    { label: "Shop", value: settings.address ? `${settings.address}, Nairobi, Kenya` : "Nairobi, Kenya" },
    settings.hours && { label: "Opening hours", value: settings.hours },
  ].filter((row) => !!row);

  return (
    <dl className="grid gap-px border border-line bg-line sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1 bg-white px-[22px] py-5">
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{row.label}</dt>
          <dd className="text-[15px]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DeliveryFees({ settings }: { settings: ShopSettings }) {
  const fee = (amount: number | null) => (amount == null ? "Confirmed when we call" : amount === 0 ? "Free" : formatKes(amount));
  const rows = [
    ["Nairobi", fee(settings.delivery.nairobi)],
    ["Rest of Kenya", fee(settings.delivery.countrywide)],
    ["Pickup from our shop", "Free"],
  ];
  return (
    <section aria-labelledby="fees-h" className="flex flex-col gap-3">
      <h2 id="fees-h" className="text-xl font-medium">Delivery fees</h2>
      <table className="w-full border border-line text-left text-[15px]">
        <tbody>
          {rows.map(([where, price]) => (
            <tr key={where} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-[22px] py-3.5 font-normal text-body">{where}</th>
              <td className="px-[22px] py-3.5 text-right font-medium">{price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {settings.delivery.freeOver != null && (
        <p className="text-sm text-body">Free delivery on orders of {formatKes(settings.delivery.freeOver)} or more.</p>
      )}
    </section>
  );
}

function Faqs({ body }: { body: string }) {
  const pairs = faqPairs(body);
  if (!pairs.length) return <RichText source={body} />;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pairs.map((pair) => ({
            "@type": "Question",
            name: pair.question,
            acceptedAnswer: { "@type": "Answer", text: blocksToPlainText(pair.blocks) },
          })),
        }}
      />
      <div className="border-t border-line">
        {pairs.map((pair) => (
          <details key={pair.question} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[18px] text-base font-medium marker:hidden hover:text-brand">
              {pair.question}
              <span aria-hidden className="text-xl leading-none text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="pb-5">
              <RichText source={blocksToSource(pair.blocks)} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

export async function InfoPage({ slug }: { slug: SitePageSlug }) {
  const [page, settings] = await Promise.all([getSitePage(slug), getShopSettings()]);
  const path = SITE_PAGES[slug].path;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: page.title, path }])} />
      <PageHeading title={page.title} />
      <main className="mx-auto flex w-full max-w-[1860px] flex-wrap items-start gap-[30px] px-6 pt-[30px] pb-20">
        <aside className="flex min-w-60 flex-[0_1_270px] flex-col gap-[30px] max-lg:order-last max-lg:flex-[1_1_100%]">
          <nav aria-label="Information">
            <SideTitle>Information</SideTitle>
            <ul className="flex flex-col border border-line px-[22px] py-[18px]">
              {Object.entries(SITE_PAGES).map(([key, info]) => (
                <li key={key}>
                  <Link
                    href={info.path}
                    aria-current={key === slug ? "page" : undefined}
                    className={`block py-2 text-[13px] transition-colors hover:text-brand ${key === slug ? "font-medium text-brand" : ""}`}
                  >
                    {info.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/track-order" className="block py-2 text-[13px] transition-colors hover:text-brand">Track your order</Link>
              </li>
            </ul>
          </nav>
          <ServiceList />
        </aside>

        <article className="flex min-w-0 max-w-[820px] flex-[999_1_560px] flex-col gap-[30px]">
          {slug === "contact" && <ContactDetails settings={settings} />}
          {slug === "faqs" ? <Faqs body={page.body} /> : page.body && <RichText source={page.body} />}
          {slug === "delivery" && <DeliveryFees settings={settings} />}
          {page.updatedAt && (slug === "privacy" || slug === "terms" || slug === "returns") && (
            <p className="text-xs text-muted">
              Last updated{" "}
              {new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(new Date(page.updatedAt))}
            </p>
          )}
        </article>
      </main>
    </>
  );
}
