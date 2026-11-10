/** The information pages. Their wording lives in the site_pages table and is edited under Pages. */
export const SITE_PAGES = {
  about: { path: "/about", title: "About us" },
  contact: { path: "/contact", title: "Contact us" },
  faqs: { path: "/faqs", title: "Frequently asked questions" },
  delivery: { path: "/delivery", title: "Delivery information" },
  returns: { path: "/returns", title: "Returns & warranty" },
  privacy: { path: "/privacy", title: "Privacy policy" },
  terms: { path: "/terms", title: "Terms & conditions" },
} as const;

export type SitePageSlug = keyof typeof SITE_PAGES;

export const isSitePageSlug = (slug: string): slug is SitePageSlug => Object.hasOwn(SITE_PAGES, slug);

export type SitePage = { slug: SitePageSlug; title: string; description: string | null; body: string; updatedAt: string | null };

/** Limits, shared by the editor and the save action (the database checks them too). */
export const PAGE_LIMITS = { title: 80, description: 300, body: 30000 };
