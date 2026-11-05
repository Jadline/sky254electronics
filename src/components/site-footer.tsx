import Link from "next/link";
import { site, whatsappLink } from "@/config/site";
import { categoryHref } from "@/lib/types";
import { NewsletterForm } from "@/components/newsletter-form";
import { ChatIcon, ChevronUpIcon } from "@/components/icons";

const COLUMNS = [
  {
    title: "Find it fast",
    links: [
      ["Smartphones", categoryHref("smartphones")],
      ["Feature phones", categoryHref("feature-phones")],
      ["Smart TVs", categoryHref("smart-tvs")],
      ["Fridges", categoryHref("fridges")],
      ["CCTV & security", categoryHref("cctv-and-security")],
      ["Speakers & radios", categoryHref("audio")],
      ["Chargers & cables", categoryHref("chargers-and-cables")],
    ],
  },
  {
    title: "Information",
    links: [
      ["Visit our shop", "/contact"],
      ["About us", "/about"],
      ["Contact us", "/contact"],
      ["Delivery information", "/delivery"],
      ["Privacy policy", "/privacy"],
      ["Terms & conditions", "/terms"],
    ],
  },
  {
    title: "Customer care",
    links: [
      ["My account", "/login"],
      ["Track my order", "/track-order"],
      ["Wishlist", "/wishlist"],
      ["Returns & warranty", "/returns"],
      ["FAQs", "/faqs"],
    ],
  },
];

const PAYMENTS = [
  { label: "M-PESA", className: "font-bold text-[#0e7a3a]" },
  { label: "VISA", className: "font-bold text-[#1a1f71]" },
  { label: "Mastercard", className: "font-bold text-text" },
  { label: "Cash on delivery", className: "font-medium text-text" },
];

export function SiteFooter() {
  const whatsapp = whatsappLink("Hi Sky254!");
  const social = [
    { label: "Facebook", href: site.social.facebook, text: "f" },
    { label: "Instagram", href: site.social.instagram, text: "ig" },
    { label: "TikTok", href: site.social.tiktok, text: "tt" },
    { label: "WhatsApp", href: whatsapp, text: null },
  ].filter((link) => link.href);

  return (
    <footer className="relative mt-auto bg-ink text-white">
      <div className="mx-auto flex w-full max-w-[1860px] flex-wrap gap-10 px-6 pt-16 pb-14">
        <div className="flex flex-[1_1_300px] flex-col gap-2.5 text-sm leading-relaxed text-on-ink">
          <span className="mb-[18px] text-3xl font-bold tracking-tight text-white">
            Sky<span className="text-accent">254</span>
          </span>
          <span>{site.address}, Nairobi, Kenya</span>
          <span>Phone / WhatsApp: {site.phone}</span>
          <span>Email: {site.email}</span>
          <span>{site.hours}</span>
          <div className="mt-[22px] mb-[18px] h-px bg-white/15" />
          <span>
            © 2026 <span className="text-accent">{site.name}</span>. All rights reserved.
          </span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PAYMENTS.map((payment) => (
              <span key={payment.label} className={`rounded-[3px] bg-white px-2.5 py-1 text-xs ${payment.className}`}>
                {payment.label}
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-[1_1_170px] flex-col gap-3.5 text-sm">
            <h2 className="mt-2.5 mb-3 text-base font-medium">{column.title}</h2>
            {column.links.map(([label, href]) => (
              <Link key={label} href={href} className="text-on-ink transition-colors hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        ))}

        <div className="flex flex-[1_1_340px] flex-col gap-4">
          <h2 className="mt-1 text-[28px] font-light">
            Get our <span className="font-medium">new stock alerts</span>
          </h2>
          <p className="text-sm leading-relaxed text-on-ink">New phones, TVs and deals, once a week by email.</p>
          <NewsletterForm />
          {social.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="mr-3 text-sm font-medium uppercase">Get in touch!</span>
              {social.map((link) => (
                <a
                  key={link.label}
                  href={link.href!}
                  aria-label={link.label}
                  className="flex size-11 items-center justify-center rounded-full border border-white/30 text-sm font-medium uppercase transition-colors hover:bg-white/10"
                >
                  {link.text ?? <ChatIcon className="size-4" />}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <a
        href="#top"
        aria-label="Back to top"
        className="btn-lift absolute right-10 bottom-10 flex size-11 items-center justify-center bg-brand text-white max-md:right-6 max-md:bottom-6"
      >
        <ChevronUpIcon className="size-5" strokeWidth={2.4} />
      </a>
    </footer>
  );
}
