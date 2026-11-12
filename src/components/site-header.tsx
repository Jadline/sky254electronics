import Link from "next/link";
import { site, whatsappLink } from "@/config/site";
import { getCategories } from "@/lib/catalog";
import { categoryHref } from "@/lib/types";
import { HeaderCounts } from "@/components/header-counts";
import { MobileMenu } from "@/components/mobile-menu";
import { ChatIcon, MenuIcon, TruckIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo-mark";

const NAV = [
  { label: "Phones", slug: "smartphones" },
  { label: "TVs & appliances", slug: "smart-tvs" },
  { label: "Fridges", slug: "fridges" },
  { label: "CCTV & security", slug: "cctv-and-security" },
];

const CONTAINER = "mx-auto w-full max-w-[1860px] px-6 max-sm:px-4";

export async function SiteHeader() {
  const categories = await getCategories();
  const whatsapp = whatsappLink("Hi Sky254, I'd like to ask about a product.");
  const nav = NAV.filter((item) => categories.some((c) => c.slug === item.slug));

  return (
    <header className="bg-white">
      <div className="bg-ink text-white">
        <div className={`${CONTAINER} flex items-center justify-between gap-x-6 py-2.5 text-xs max-sm:justify-center max-sm:py-2 max-sm:text-[11px]`}>
          <div className="flex flex-wrap gap-x-11 gap-y-1">
            <span className="uppercase max-sm:text-center">
              Same-day delivery in Nairobi · <span className="text-accent">Pay with M-Pesa</span>
            </span>
            <span className="max-md:hidden">
              Call / WhatsApp: <span className="text-accent">{site.phone}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 max-sm:hidden">
            <span>KENYA · KSh</span>
            {whatsapp && (
              <a href={whatsapp} aria-label="WhatsApp" className="flex size-6 items-center justify-center">
                <ChatIcon className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Phones and tablets: menu button, logo and the cart in one row. Wider screens: logo and the nav. */}
      <div className={`${CONTAINER} flex items-center gap-x-[60px] pt-[26px] pb-[22px] max-lg:gap-x-2 max-lg:pt-3 max-lg:pb-3`}>
        <MobileMenu
          main={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...nav.map((item) => ({ label: item.label, href: categoryHref(item.slug) })), { label: "Help & contact", href: "/contact" }]}
          departments={categories.map((category) => ({ label: category.name, href: categoryHref(category.slug) }))}
          phone={site.phone}
          whatsapp={whatsapp}
        />
        <Link href="/" aria-label="Sky254 home" className="flex items-center gap-1.5 text-3xl leading-none font-bold tracking-tight text-text max-sm:text-[26px]">
          <LogoMark className="h-12 w-auto flex-none max-sm:h-10" />
          <span className="flex flex-col gap-1.5">
            <span>
              Sky<span className="text-brand">254</span>
            </span>
            <span className="pl-px text-[10px] font-bold tracking-[0.42em] text-[#4a5566] max-sm:text-[9px]">ELECTRONICS</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap items-center gap-x-[34px] gap-y-2 pt-1 text-[13px] font-medium uppercase max-lg:hidden">
          <Link href="/" className="transition-colors hover:text-brand">Home</Link>
          <Link href="/shop" className="relative transition-colors hover:text-brand">
            Shop
            <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] whitespace-nowrap normal-case text-text">
              New stock
            </span>
          </Link>
          {nav.map((item) => (
            <Link key={item.label} href={categoryHref(item.slug)} className="transition-colors hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className="text-[13px] transition-colors hover:text-brand max-lg:hidden">Help &amp; contact</Link>
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <HeaderCounts compact />
        </div>
      </div>

      <div className={`${CONTAINER} flex items-center gap-x-[30px] pb-[18px] max-lg:pb-3`}>
        <Link
          href="/shop"
          className="flex h-11 flex-[0_0_270px] items-center gap-3.5 bg-brand px-5 text-[13px] font-medium text-white uppercase transition-colors hover:bg-brand-dark max-lg:hidden"
        >
          <MenuIcon className="size-4" /> All departments
        </Link>

        <form role="search" action="/shop" className="flex h-11 min-w-0 flex-1 border border-line">
          <select
            name="category"
            aria-label="Category"
            defaultValue=""
            className="w-[190px] border-r border-line bg-white pr-4 pl-5 text-[13px] font-medium max-md:hidden"
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
            // 16px on phones stops iOS zooming in when the box is tapped.
            className="min-w-0 flex-1 px-[18px] text-[13px] outline-none max-md:px-3.5 max-md:text-base"
          />
          <button type="submit" className="cursor-pointer bg-brand px-[30px] text-[13px] font-medium text-white uppercase transition-colors hover:bg-brand-dark max-md:px-4">
            Search
          </button>
        </form>

        <div className="flex items-center gap-5 max-lg:hidden">
          <Link href="/track-order" className="inline-flex items-center gap-2.5 text-[13px] whitespace-nowrap transition-colors hover:text-brand">
            <TruckIcon className="size-6" strokeWidth={1.5} /> Track your order
          </Link>
          <HeaderCounts />
        </div>
      </div>
    </header>
  );
}
