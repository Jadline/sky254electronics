"use server";

import { cookies } from "next/headers";
import { salePrice } from "@/lib/pricing";
import { MAX_CART_LINES, MAX_LINE_QTY, MAX_WISHLIST, type ShopChange, type ShopState } from "@/lib/shop-types";
import { createAdminClient } from "@/lib/supabase/admin";

// The cart and wishlist live in the shop_carts table. The browser keeps only the row's
// random id, in an httpOnly cookie, so page scripts can't read or change it.
const COOKIE = "sky254-cart";
const COOKIE_DAYS = 180;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Slugs aren't restricted in the database, so only the length is checked; lookups do the rest.
const SLUG = /^\S{1,200}$/;
const EMPTY: ShopState = { cart: [], wishlist: [] };

type StoredLine = { slug: string; name: string; qty: number };
type Stored = { cart: StoredLine[]; wishlist: string[] };

const isSlug = (value: unknown): value is string => typeof value === "string" && SLUG.test(value);
const clampQty = (qty: unknown) => Math.min(MAX_LINE_QTY, Math.max(1, Math.trunc(Number(qty)) || 1));

async function cartId() {
  const id = (await cookies()).get(COOKIE)?.value;
  return id && UUID.test(id) ? id : null;
}

/** Reads a row, dropping anything malformed so one bad entry can't break the cart. */
async function readRow(id: string): Promise<Stored | null> {
  const { data } = await createAdminClient().from("shop_carts").select("cart, wishlist").eq("id", id).maybeSingle();
  if (!data) return null;
  const cart = (Array.isArray(data.cart) ? data.cart : []).filter(
    (line: StoredLine) => isSlug(line?.slug) && typeof line.name === "string" && Number.isInteger(line.qty),
  );
  const wishlist = (Array.isArray(data.wishlist) ? data.wishlist : []).filter(isSlug);
  return { cart, wishlist };
}

/** Names and today's prices for the products that can be bought, by slug. */
async function lookUp(slugs: string[]) {
  const found = new Map<string, { name: string; priceKes: number | null }>();
  if (slugs.length === 0) return found;
  const { data } = await createAdminClient()
    .from("products")
    .select("slug, name, price_kes, discount_type, discount_value, in_stock, is_active")
    .in("slug", [...new Set(slugs)]);
  for (const p of data ?? []) {
    if (!p.is_active) continue;
    const price = p.in_stock && p.price_kes != null ? (salePrice(p.price_kes, p.discount_type, p.discount_value) ?? p.price_kes) : null;
    found.set(p.slug, { name: p.name, priceKes: price });
  }
  return found;
}

/** What the browser is sent: every line with today's price, or 0 when it can't be bought. */
async function present(stored: Stored): Promise<ShopState> {
  const products = await lookUp(stored.cart.map((line) => line.slug));
  return {
    cart: stored.cart.map((line) => {
      const product = products.get(line.slug);
      return { slug: line.slug, name: product?.name ?? line.name, priceKes: product?.priceKes ?? 0, qty: line.qty };
    }),
    wishlist: stored.wishlist,
  };
}

/** The visitor's cart and wishlist. Visitors who haven't added anything have no row. */
export async function getShop(): Promise<ShopState> {
  const id = await cartId();
  const stored = id ? await readRow(id) : null;
  return stored ? present(stored) : EMPTY;
}

/** Applies one change and returns the cart and wishlist as they now are. */
export async function changeShop(change: ShopChange): Promise<ShopState> {
  const id = await cartId();
  const existing = id ? await readRow(id) : null;
  const before: Stored = existing ?? { cart: [], wishlist: [] };
  const after = await apply(before, change);
  if (!after) return present(before);

  const db = createAdminClient();
  if (existing && id) {
    const { error } = await db.from("shop_carts").update(after).eq("id", id);
    if (error) throw new Error("Couldn't save the cart.");
  } else {
    // Nothing to keep: don't create a row (or a cookie) for an empty cart.
    if (after.cart.length === 0 && after.wishlist.length === 0) return EMPTY;
    const { data, error } = await db.from("shop_carts").insert(after).select("id").single();
    if (error || !data) throw new Error("Couldn't save the cart.");
    (await cookies()).set(COOKIE, data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_DAYS * 24 * 60 * 60,
    });
  }
  return present(after);
}

/** The cart and wishlist after a change, or null when the change isn't valid. */
async function apply(state: Stored, change: ShopChange): Promise<Stored | null> {
  const { cart, wishlist } = state;
  switch (change?.type) {
    case "add": {
      if (!isSlug(change.slug)) return null;
      // Only products that can be bought go in the cart, named as the catalogue names them.
      const product = (await lookUp([change.slug])).get(change.slug);
      if (!product || product.priceKes == null) return null;
      const qty = clampQty(change.qty);
      const existing = cart.find((line) => line.slug === change.slug);
      if (existing) {
        return {
          cart: cart.map((line) => (line.slug === change.slug ? { ...line, name: product.name, qty: clampQty(line.qty + qty) } : line)),
          wishlist,
        };
      }
      if (cart.length >= MAX_CART_LINES) return null;
      return { cart: [...cart, { slug: change.slug, name: product.name, qty }], wishlist };
    }
    case "qty":
      return { cart: cart.map((line) => (line.slug === change.slug ? { ...line, qty: clampQty(change.qty) } : line)), wishlist };
    case "remove":
      return { cart: cart.filter((line) => line.slug !== change.slug), wishlist };
    case "clear":
      return { cart: [], wishlist };
    case "wishlist": {
      if (wishlist.includes(change.slug)) return { cart, wishlist: wishlist.filter((slug) => slug !== change.slug) };
      if (!isSlug(change.slug) || wishlist.length >= MAX_WISHLIST) return null;
      if (!(await lookUp([change.slug])).has(change.slug)) return null;
      return { cart, wishlist: [...wishlist, change.slug] };
    }
    case "import": {
      // Merged into whatever is already saved, keeping only products that still exist.
      const lines = (Array.isArray(change.cart) ? change.cart : []).filter((line) => isSlug(line?.slug)).slice(0, MAX_CART_LINES);
      const saved = (Array.isArray(change.wishlist) ? change.wishlist : []).filter(isSlug).slice(0, MAX_WISHLIST);
      const products = await lookUp([...lines.map((line) => line.slug), ...saved]);
      const nextCart = [...cart];
      for (const line of lines) {
        const product = products.get(line.slug);
        if (!product || product.priceKes == null || nextCart.length >= MAX_CART_LINES) continue;
        const existing = nextCart.findIndex((l) => l.slug === line.slug);
        if (existing >= 0) nextCart[existing] = { ...nextCart[existing], qty: clampQty(nextCart[existing].qty + clampQty(line.qty)) };
        else nextCart.push({ slug: line.slug, name: product.name, qty: clampQty(line.qty) });
      }
      const nextWishlist = [...new Set([...wishlist, ...saved.filter((slug) => products.has(slug))])].slice(0, MAX_WISHLIST);
      return { cart: nextCart, wishlist: nextWishlist };
    }
    default:
      return null;
  }
}
