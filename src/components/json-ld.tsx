import { absoluteUrl, site, siteUrl } from "@/config/site";
import type { ShopSettings } from "@/lib/settings";
import type { ReviewSummary } from "@/lib/reviews";
import { productHref, type Product } from "@/lib/types";

/**
 * Structured data for search engines. "<" is escaped so text from the dashboard
 * can't close the script tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const ORGANIZATION_ID = `${siteUrl}/#store`;

/** The shop as a local business: name, phone, address, hours and social profiles. */
export function storeJsonLd(settings: ShopSettings) {
  const sameAs = Object.values(settings.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: siteUrl,
    image: absoluteUrl("/opengraph-image"),
    telephone: site.phone.replace(/\s/g, ""),
    ...(settings.email && { email: settings.email }),
    address: {
      "@type": "PostalAddress",
      ...(settings.address && { streetAddress: settings.address }),
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    // Free text from Shop settings, e.g. "Mon–Sat, 8am – 7pm". Google reads it as a hint.
    ...(settings.hours && { openingHours: settings.hours }),
    currenciesAccepted: "KES",
    paymentAccepted: "M-Pesa, Cash",
    areaServed: { "@type": "Country", name: "Kenya" },
    ...(sameAs.length && { sameAs }),
  };
}

/**
 * A product and its offer, for Google's product results. Products without a price
 * ("Ask for price") have no offer, so Google shows them without one.
 */
export function productJsonLd(product: Product, shippingRate: number | null, reviews?: ReviewSummary) {
  const url = absoluteUrl(productHref(product.slug));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    sku: product.slug,
    image: product.photos.map((photo) => absoluteUrl(photo.src)),
    ...(product.description && { description: product.description.slice(0, 5000) }),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    category: product.category.name,
    // Stars in Google results. Only approved reviews, which customers wrote on this site.
    ...(reviews?.count && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count, bestRating: 5, worstRating: 1 },
      review: reviews.reviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        datePublished: r.createdAt.slice(0, 10),
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        ...(r.title && { name: r.title }),
        reviewBody: r.body,
      })),
    }),
    ...(product.priceKes != null && {
      offers: {
        "@type": "Offer",
        url,
        price: product.priceKes,
        priceCurrency: "KES",
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": ORGANIZATION_ID },
        ...(shippingRate != null && {
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: shippingRate, currency: "KES" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "KE" },
          },
        }),
      },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
