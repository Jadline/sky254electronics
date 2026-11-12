/** A cart line. The price is today's, read from the catalogue; 0 when it can't be bought. */
export type CartItem = { slug: string; name: string; priceKes: number; qty: number };

export type ShopState = { cart: CartItem[]; wishlist: string[] };

/** A change to a visitor's cart or wishlist, applied on the server. */
export type ShopChange =
  | { type: "add"; slug: string; qty: number }
  | { type: "qty"; slug: string; qty: number }
  | { type: "remove"; slug: string }
  | { type: "clear" }
  | { type: "wishlist"; slug: string }
  /** A cart and wishlist saved in the browser by the old version of the site, moved over once. */
  | { type: "import"; cart: { slug: string; qty: number }[]; wishlist: string[] };

export const MAX_CART_LINES = 50;
export const MAX_WISHLIST = 100;
/** The most of one product a cart line can hold. */
export const MAX_LINE_QTY = 9;
