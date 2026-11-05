export type ProductPhoto = { src: string; alt: string };

export type Product = {
  slug: string;
  name: string;
  brand: string | null;
  category: { slug: string; name: string };
  priceKes: number | null;
  warranty: string | null;
  badge: string | null;
  inStock: boolean;
  /** The product on its own. Missing when we only have a box photo. */
  photo: ProductPhoto | null;
  /** The product in its box, or in the shop. */
  boxPhoto: ProductPhoto | null;
};

export type Category = { slug: string; name: string };

export function formatKes(amount: number) {
  return "KSh " + amount.toLocaleString("en-KE");
}

export function priceText(product: Pick<Product, "priceKes">) {
  return product.priceKes == null ? "Ask for price" : formatKes(product.priceKes);
}

export const productHref = (slug: string) => `/products/${slug}`;
export const categoryHref = (slug: string) => `/shop?category=${slug}`;
