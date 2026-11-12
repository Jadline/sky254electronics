/**
 * The information pages, for the side menu, footer and sitemap. About and Contact are
 * written into the site (About's "Why choose us?" answers the common questions), and the legal pages' wording
 * is edited in the dashboard under Legal pages (the site_pages table).
 */
export const SITE_PAGES = {
  about: {
    path: "/about",
    title: "About us",
    description: "Sky254 Electronics is a Nairobi electronics shop selling genuine phones, TVs, fridges, CCTV and accessories, with delivery across Kenya.",
  },
  contact: {
    path: "/contact",
    title: "Contact us",
    description: "Call, WhatsApp, email or visit Sky254 Electronics in Nairobi.",
  },
  delivery: {
    path: "/delivery",
    title: "Delivery information",
    description: "Delivery fees and times for Sky254 Electronics orders in Nairobi and across Kenya, plus free pickup from our shop.",
  },
  returns: {
    path: "/returns",
    title: "Returns & warranty",
    description: "Warranty cover and the returns policy for products bought from Sky254 Electronics.",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy policy",
    description: "How Sky254 Electronics collects, uses and protects your personal data.",
  },
  terms: {
    path: "/terms",
    title: "Terms & conditions",
    description: "The terms that apply when you buy from Sky254 Electronics.",
  },
} as const;

export type SitePageSlug = keyof typeof SITE_PAGES;

/** The pages edited under Legal pages, in the order of the tabs there. */
export const LEGAL_SLUGS = ["privacy", "terms", "returns", "delivery"] as const satisfies readonly SitePageSlug[];

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const isLegalSlug = (slug: string): slug is LegalSlug => (LEGAL_SLUGS as readonly string[]).includes(slug);

/** A legal page's text. `updatedAt` is null when it hasn't been saved (the starter text shows). */
export type LegalPage = { slug: LegalSlug; body: string; updatedAt: string | null };

/** The most a legal page can hold (the database checks it too). */
export const LEGAL_BODY_MAX = 30000;
