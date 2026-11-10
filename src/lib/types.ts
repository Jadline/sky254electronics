export type ProductPhoto = { src: string; alt: string };

/** A photo in a product's slideshow. "product" photos are shown whole, "box" photos fill the frame. */
export type GalleryPhoto = ProductPhoto & { kind: "product" | "box" };

export type Product = {
  slug: string;
  name: string;
  brand: string | null;
  category: { slug: string; name: string };
  priceKes: number | null;
  /** The price before an offer, shown crossed out. Only set when higher than priceKes. */
  wasPriceKes: number | null;
  warranty: string | null;
  badge: string | null;
  description: string | null;
  /** Shorter title for the Home page slider and banners. */
  shortName: string | null;
  isFeatured: boolean;
  showInHero: boolean;
  showInBanner: boolean;
  inStock: boolean;
  /** Units remaining (Stock - Sold) when the shop counts this product; null when it doesn't. */
  stockQty: number | null;
  /** The product on its own. Missing when we only have a box photo. */
  photo: ProductPhoto | null;
  /** The product in its box, or in the shop. */
  boxPhoto: ProductPhoto | null;
  /** Every photo, in display order, for slideshows. */
  photos: GalleryPhoto[];
};

export type Category = { slug: string; name: string; description?: string | null };

export function formatKes(amount: number) {
  return "KSh " + amount.toLocaleString("en-KE");
}

export function priceText(product: Pick<Product, "priceKes">) {
  return product.priceKes == null ? "Ask for price" : formatKes(product.priceKes);
}

export const productHref = (slug: string) => `/products/${slug}`;
export const categoryHref = (slug: string) => `/shop/${slug}`;
