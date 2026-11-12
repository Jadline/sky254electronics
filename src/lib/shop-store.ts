"use client";

import { useSyncExternalStore } from "react";
import { changeShop, getShop } from "@/app/(site)/cart/actions";
import { track } from "@/lib/analytics";
import { MAX_LINE_QTY, type CartItem, type ShopChange, type ShopState } from "@/lib/shop-types";

export type { CartItem } from "@/lib/shop-types";

// Cart and wishlist, saved on the server against an httpOnly cookie (see cart/actions.ts).
// Changes show straight away and are sent to the server one at a time; its reply, with
// today's prices, replaces what's shown. Checkout still re-reads every price itself.

/** `loaded` is false until the server has answered, so pages don't flash "empty". */
export type Shop = ShopState & { loaded: boolean };

const EMPTY: Shop = { cart: [], wishlist: [], loaded: false };
/** Where the old version of the site kept the cart. Moved to the server once, then removed. */
const LEGACY_KEY = "sky254-shop";

let state: Shop = EMPTY;
let started = false;
let queue: Promise<unknown> = Promise.resolve();
/** Changes sent but not yet answered. Only the last answer is shown, so clicks don't flicker. */
let inFlight = 0;
const listeners = new Set<() => void>();
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("sky254-shop");

function set(next: Shop) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Sends a request after any already waiting, and shows the server's answer. */
function send(request: () => Promise<ShopState>, { notify = true } = {}) {
  inFlight++;
  queue = queue
    .then(request)
    .then(
      (server) => {
        inFlight--;
        if (inFlight === 0) set({ ...server, loaded: true });
        if (notify) channel?.postMessage("changed");
      },
      () => {
        inFlight--;
        // A change wasn't saved: show what the server really has. If reading failed
        // (offline, say), keep what's shown rather than retrying in a loop.
        if (notify) refetch();
        else if (inFlight === 0) set({ ...state, loaded: true });
      },
    );
}

function refetch() {
  send(getShop, { notify: false });
}

function start() {
  if (started) return;
  started = true;
  let legacy: { cart?: { slug: string; qty: number }[]; wishlist?: string[] } | null = null;
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null");
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Private mode or bad data: nothing to move over.
  }
  const cart = Array.isArray(legacy?.cart) ? legacy.cart.map((line) => ({ slug: line?.slug, qty: line?.qty })) : [];
  const wishlist = Array.isArray(legacy?.wishlist) ? legacy.wishlist : [];
  if (cart.length || wishlist.length) send(() => changeShop({ type: "import", cart, wishlist }));
  else refetch();
  // Another tab changed the cart.
  if (channel) channel.onmessage = refetch;
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useShop() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/** Shows the change now and saves it on the server. */
function change(next: Omit<Shop, "loaded">, request: ShopChange) {
  set({ ...next, loaded: state.loaded });
  send(() => changeShop(request));
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const existing = state.cart.find((line) => line.slug === item.slug);
  change(
    {
      ...state,
      cart: existing
        ? state.cart.map((line) => (line.slug === item.slug ? { ...line, ...item, qty: Math.min(MAX_LINE_QTY, line.qty + qty) } : line))
        : [...state.cart, { ...item, qty }],
    },
    { type: "add", slug: item.slug, qty },
  );
  track({ name: "add_to_cart", items: [{ id: item.slug, name: item.name, priceKes: item.priceKes, qty }] });
}

export function setCartQty(slug: string, qty: number) {
  const clamped = Math.min(MAX_LINE_QTY, Math.max(1, qty));
  change(
    { ...state, cart: state.cart.map((line) => (line.slug === slug ? { ...line, qty: clamped } : line)) },
    { type: "qty", slug, qty: clamped },
  );
}

export function removeFromCart(slug: string) {
  change({ ...state, cart: state.cart.filter((line) => line.slug !== slug) }, { type: "remove", slug });
}

export function clearCart() {
  change({ ...state, cart: [] }, { type: "clear" });
}

export function toggleWishlist(slug: string) {
  change(
    {
      ...state,
      wishlist: state.wishlist.includes(slug) ? state.wishlist.filter((s) => s !== slug) : [...state.wishlist, slug],
    },
    { type: "wishlist", slug },
  );
}
