import type { ReactNode } from "react";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { ChatIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon, TruckIcon } from "@/components/icons";
import { infoPageMetadata } from "@/components/info-page";
import { breadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { PageHeading } from "@/components/page-heading";
import { mapEmbedUrl, shopPlace, site, whatsappLink } from "@/config/site";
import { getShopSettings } from "@/lib/catalog";
import { SITE_PAGES } from "@/lib/site-pages";

export const generateMetadata = () => infoPageMetadata("contact");

const LINK = "text-brand hover:underline";

/** One of the three columns under the map. */
function DetailColumn({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-tint text-brand">{icon}</span>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="flex flex-col gap-1 text-[15px] leading-relaxed text-body">{children}</div>
    </div>
  );
}

/** A way to reach us, shown beside the form where the design has staff photos. */
function HelpCard({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex gap-5">
      <span className="grid size-[72px] shrink-0 place-items-center bg-tint text-brand sm:size-24">{icon}</span>
      <div className="flex min-w-0 flex-col gap-1.5 pt-1">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-body">{text}</p>
        <div className="flex flex-col gap-1 text-sm">{children}</div>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const settings = await getShopSettings();
  const { path, title } = SITE_PAGES.contact;
  const whatsapp = whatsappLink("Hi Sky254!");
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;
  const place = shopPlace(settings.address);
  const mapQuery = encodeURIComponent(place);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: title, path }])} />
      <PageHeading title={title} inset={false} />

      <main className="pb-20">
        {/* Google's keyless embed. Nothing loads until it scrolls near the screen. */}
        <div className="relative h-[320px] bg-tint sm:h-[420px] lg:h-[500px]">
          <iframe
            title={`Map showing ${place}`}
            src={mapEmbedUrl(settings.address)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        </div>

        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <section aria-label="Contact details" className="grid gap-10 border-b border-line py-12 md:grid-cols-3 md:gap-6">
            <DetailColumn icon={<MapPinIcon className="size-6" />} title="Visit our shop">
              <p>{place}</p>
              {settings.hours && <p>{settings.hours}</p>}
              <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} className={LINK}>
                Get directions
              </a>
            </DetailColumn>
            <DetailColumn icon={<PhoneIcon className="size-6" />} title="Call or WhatsApp">
              <p>
                Phone: <a href={tel} className={LINK}>{site.phone}</a>
              </p>
              {whatsapp && (
                <p>
                  <a href={whatsapp} className={LINK}>Message us on WhatsApp</a>
                </p>
              )}
              <p className="text-muted">Fastest for stock and price checks</p>
            </DetailColumn>
            <DetailColumn icon={<MailIcon className="size-6" />} title="Email us">
              {settings.email ? (
                <p>
                  <a href={`mailto:${settings.email}`} className={`${LINK} break-all`}>{settings.email}</a>
                </p>
              ) : (
                <p>Use the form below and we&apos;ll reply by email.</p>
              )}
              <p className="text-muted">We reply within one working day</p>
            </DetailColumn>
          </section>

          <section className="grid gap-12 pt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[30px]">
            <div className="flex flex-col gap-8">
              <h2 className="text-[34px] leading-tight font-semibold sm:text-[44px]">How can we help you?</h2>
              <p className="text-[15px] leading-relaxed text-body">
                We&apos;re happy to help you choose, check stock or follow up an order. WhatsApp is usually the fastest way to reach us. If
                it&apos;s about an order, please have your order number ready.
              </p>
              <HelpCard
                icon={<ChatIcon className="size-9 sm:size-10" />}
                title="Sales & product advice"
                text="Questions about a product, stock or prices."
              >
                <a href={tel} className={LINK}>{site.phone}</a>
                {whatsapp && <a href={whatsapp} className={LINK}>Chat on WhatsApp</a>}
              </HelpCard>
              <HelpCard
                icon={<TruckIcon className="size-9 sm:size-10" />}
                title="Orders & delivery"
                text="Check where your order is with its number and your phone."
              >
                <Link href="/track-order" className={LINK}>Track your order</Link>
                <Link href={SITE_PAGES.delivery.path} className={LINK}>Delivery information</Link>
              </HelpCard>
              {settings.hours && (
                <HelpCard icon={<ClockIcon className="size-9 sm:size-10" />} title="Opening hours" text={settings.hours}>
                  <Link href={SITE_PAGES.about.path} className={LINK}>Why shop with us</Link>
                </HelpCard>
              )}
            </div>
            <ContactForm />
          </section>
        </div>
      </main>
    </>
  );
}
