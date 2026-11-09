"use client";

import { useEffect, useRef, useState } from "react";
import { whatsappLink } from "@/config/site";
import { addToCart, toggleWishlist, useShop } from "@/lib/shop-store";
import type { Product } from "@/lib/types";
import { ChatIcon, HeartIcon } from "@/components/icons";

/** Add to cart with brief "Added" feedback. Falls back when a product can't be bought. */
export function AddToCartButton({ product, qty = 1, className }: { product: Product; qty?: number; className: string }) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const price = product.priceKes;
  const unavailable = !product.inStock || price == null;

  return (
    <button
      type="button"
      disabled={unavailable}
      className={`whitespace-nowrap uppercase ${unavailable ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
      onClick={() => {
        if (price == null) return;
        addToCart({ slug: product.slug, name: product.name, priceKes: price }, qty);
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1200);
      }}
    >
      {!product.inStock ? "Sold out" : price == null ? "Ask for price" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}

export function WishlistButton({ product }: { product: Product }) {
  const { wishlist } = useShop();
  const saved = wishlist.includes(product.slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} wishlist`}
      onClick={() => toggleWishlist(product.slug)}
      className="btn-lift flex size-10 flex-none cursor-pointer items-center justify-center rounded-full border border-line bg-white text-brand"
    >
      <HeartIcon className="size-[18px]" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

/** Panel under a card: appears on hover or keyboard focus, always visible on touch screens. */
export function CardActions({ product }: { product: Product }) {
  const whatsapp = whatsappLink(`Hi Sky254, is the ${product.name} available?`);
  return (
    <div className="absolute inset-x-[-1px] top-full z-10 hidden items-center justify-center gap-2 border border-t-0 border-line bg-white px-3.5 pt-3.5 pb-[18px] shadow-[0_14px_24px_rgba(29,33,40,0.12)] group-focus-within:flex group-hover:flex [@media(hover:none)]:relative [@media(hover:none)]:inset-auto [@media(hover:none)]:flex [@media(hover:none)]:border-0 [@media(hover:none)]:p-0 [@media(hover:none)]:shadow-none">
      {whatsapp && (
        <a
          href={whatsapp}
          aria-label={`Ask about ${product.name} on WhatsApp`}
          className="btn-lift flex size-10 flex-none items-center justify-center rounded-full border border-line bg-white text-brand"
        >
          <ChatIcon className="size-[18px]" strokeWidth={2} />
        </a>
      )}
      <AddToCartButton
        product={product}
        className="btn-lift h-10 min-w-0 flex-1 rounded-full bg-brand px-3 text-[13px] font-medium text-white"
      />
      <WishlistButton product={product} />
    </div>
  );
}
