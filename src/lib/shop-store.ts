"use client";

import { useSyncExternalStore } from "react";

// Cart and wishlist, saved in this browser. Prices here are a snapshot for the
// header total; checkout must re-read them from the database.
export type CartItem = { slug: string; name: string; priceKes: number; qty: number };
type ShopState = { cart: CartItem[]; wishlist: string[] };

const KEY = "sky254-shop";
const EMPTY: ShopState = { cart: [], wishlist: [] };

let state: ShopState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && Array.isArray(saved.cart) && Array.isArray(saved.wishlist)) state = saved;
  } catch {
    // Private mode or bad data: start empty.
  }
}

function update(next: ShopState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not saved, but still works until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot() {
  load();
  return state;
}

export function useShop() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  load();
  const existing = state.cart.find((line) => line.slug === item.slug);
  update({
    ...state,
    cart: existing
      ? state.cart.map((line) =>
          line.slug === item.slug ? { ...line, ...item, qty: line.qty + qty } : line,
        )
      : [...state.cart, { ...item, qty }],
  });
}

export function setCartQty(slug: string, qty: number) {
  load();
  update({
    ...state,
    cart: state.cart.map((line) => (line.slug === slug ? { ...line, qty: Math.min(9, Math.max(1, qty)) } : line)),
  });
}

export function removeFromCart(slug: string) {
  load();
  update({ ...state, cart: state.cart.filter((line) => line.slug !== slug) });
}

export function clearCart() {
  load();
  update({ ...state, cart: [] });
}

export function toggleWishlist(slug: string) {
  load();
  update({
    ...state,
    wishlist: state.wishlist.includes(slug)
      ? state.wishlist.filter((s) => s !== slug)
      : [...state.wishlist, slug],
  });
}
