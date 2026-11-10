import Link from "next/link";
import { site, whatsappLink } from "@/config/site";
import { getCategories } from "@/lib/catalog";
import { categoryHref } from "@/lib/types";
import { HeaderCounts } from "@/components/header-counts";
import { ChatIcon, MenuIcon, TruckIcon } from "@/components/icons";

const NAV = [
  { label: "Phones", slug: "smartphones" },
  { label: "TVs & appliances", slug: "smart-tvs" },
  { label: "Fridges", slug: "fridges" },
  { label: "CCTV & security", slug: "cctv-and-security" },
];

const CONTAINER = "mx-auto w-full max-w-[1860px] px-6";

export async function SiteHeader() {
  const categories = await getCategories();
  const whatsapp = whatsappLink("Hi Sky254, I'd like to ask about a product.");

  return (
    <header className="bg-white">
      <div className="bg-ink text-white">
        <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5 text-xs`}>
          <div className="flex flex-wrap gap-x-11 gap-y-1">
            <span className="uppercase">
              Same-day delivery in Nairobi · <span className="text-accent">Pay with M-Pesa</span>
            </span>
            <span>
              Call / WhatsApp: <span className="text-accent">{site.phone}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>KENYA · KSh</span>
            {whatsapp && (
              <a href={whatsapp} aria-label="WhatsApp" className="flex size-6 items-center justify-center">
                <ChatIcon className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={`${CONTAINER} flex flex-wrap items-center gap-x-[60px] gap-y-4 pt-[26px] pb-[22px]`}>
        <Link href="/" aria-label="Sky254 home" className="text-3xl leading-none font-bold tracking-tight text-text">
          Sky<span className="text-brand">254</span>
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap items-center gap-x-[34px] gap-y-2 pt-1 text-[13px] font-medium uppercase max-lg:order-last max-lg:flex-[1_1_100%] max-sm:gap-x-5">
          <Link href="/" className="transition-colors hover:text-brand">Home</Link>
          <Link href="/shop" className="relative transition-colors hover:text-brand">
            Shop
            <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] whitespace-nowrap normal-case text-text max-lg:hidden">
              New stock
            </span>
          </Link>
          {NAV.filter((item) => categories.some((c) => c.slug === item.slug)).map((item) => (
            <Link key={item.label} href={categoryHref(item.slug)} className="transition-colors hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className="text-[13px] transition-colors hover:text-brand max-lg:ml-auto">Help &amp; contact</Link>
      </div>

      <div className={`${CONTAINER} flex flex-wrap items-center gap-x-[30px] gap-y-3.5 pb-[18px]`}>
        <Link
          href="/shop"
          className="flex h-11 flex-[0_0_270px] items-center gap-3.5 bg-brand px-5 text-[13px] font-medium text-white uppercase transition-colors hover:bg-brand-dark max-lg:flex-[1_1_100%]"
        >
          <MenuIcon className="size-4" /> All departments
        </Link>

        <form role="search" action="/shop" className="flex h-11 min-w-0 flex-[1_1_460px] border border-line">
          <select
            name="category"
            aria-label="Category"
            defaultValue=""
            className="w-[190px] border-r border-line bg-white pr-4 pl-5 text-[13px] font-medium max-sm:hidden"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            aria-label="Search products"
            placeholder="What do you need?"
            className="min-w-0 flex-1 px-[18px] text-[13px] outline-none"
          />
          <button type="submit" className="cursor-pointer bg-brand px-[30px] text-[13px] font-medium text-white uppercase transition-colors hover:bg-brand-dark max-sm:px-3">
            Search
          </button>
        </form>

        <div className="flex items-center gap-5">
          <Link href="/track-order" className="inline-flex items-center gap-2.5 text-[13px] transition-colors hover:text-brand">
            <TruckIcon className="size-6" strokeWidth={1.5} /> Track your order
          </Link>
          <HeaderCounts />
        </div>
      </div>
    </header>
  );
}
