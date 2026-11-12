import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { PageHeading } from "@/components/page-heading";
import { RichText } from "@/components/rich-text";
import { ServiceList } from "@/components/service-list";
import { SideTitle } from "@/components/side-title";
import { getDelivery, getLegalPage } from "@/lib/catalog";
import type { DeliveryChoices } from "@/lib/delivery";
import { SITE_PAGES, type LegalSlug, type SitePageSlug } from "@/lib/site-pages";
import { formatKes } from "@/lib/types";

/** Titles and Google descriptions are part of the site, so every page's metadata is fixed. */
export function infoPageMetadata(slug: SitePageSlug): Metadata {
  const page = SITE_PAGES[slug];
  return { title: page.title, description: page.description, alternates: { canonical: page.path } };
}

function DeliveryFees({ delivery }: { delivery: DeliveryChoices }) {
  const fee = (amount: number | null) => (amount == null ? "Confirmed when we call" : amount === 0 ? "Free" : formatKes(amount));
  const rows = [
    ...delivery.options.map((o) => [o.areas ? `${o.name} (${o.areas})` : o.name, fee(o.costKes)]),
    ...delivery.pickupPoints.map((p) => [`Pickup: ${p.name}`, "Free"]),
  ];
  if (rows.length === 0) return null;
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
      {delivery.freeOver != null && <p className="text-sm text-body">Free delivery on orders of {formatKes(delivery.freeOver)} or more.</p>}
    </section>
  );
}

async function LegalBody({ slug }: { slug: LegalSlug }) {
  const [page, delivery] = await Promise.all([getLegalPage(slug), slug === "delivery" ? getDelivery() : null]);
  return (
    <>
      <RichText source={page.body} />
      {delivery && <DeliveryFees delivery={delivery} />}
      {page.updatedAt && slug !== "delivery" && (
        <p className="text-xs text-muted">
          Last updated {new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(new Date(page.updatedAt))}
        </p>
      )}
    </>
  );
}

/** The legal pages: the page's text beside the Information menu. */
export function InfoPage({ slug }: { slug: LegalSlug }) {
  const { path, title } = SITE_PAGES[slug];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: title, path }])} />
      <PageHeading title={title} />
      <main className="mx-auto flex w-full max-w-[1860px] flex-wrap items-start gap-[30px] px-6 pt-[30px] max-sm:px-4 pb-20">
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
          <LegalBody slug={slug} />
        </article>
      </main>
    </>
  );
}
