"use client";

import { useState } from "react";
import { AddToCartButton, WishlistButton } from "@/components/card-actions";
import { ChatIcon } from "@/components/icons";
import { whatsappLink } from "@/config/site";
import { LOW_STOCK } from "@/lib/inventory";
import type { Product } from "@/lib/types";

export function BuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const whatsapp = whatsappLink(`Hi Sky254, is the ${product.name} available?`);
  const canBuy = product.inStock && product.priceKes != null;
  // Counted products can't be ordered past what's left.
  const maxQty = Math.min(9, product.stockQty ?? 9);
  const fewLeft = canBuy && product.stockQty != null && product.stockQty > 0 && product.stockQty <= LOW_STOCK;

  return (
    <>
      {canBuy && (
        <div className="flex items-center gap-3.5 text-sm text-body">
          Quantity:
          <div role="group" aria-label="Quantity" className="flex h-10 items-center border border-line">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="h-full w-9 cursor-pointer">−</button>
            <span aria-live="polite" className="min-w-7 text-center font-medium text-text">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(maxQty, qty + 1))} className="h-full w-9 cursor-pointer">+</button>
          </div>
          {fewLeft && <span className="font-medium text-[#b45309]">Only {product.stockQty} left</span>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <AddToCartButton
          product={product}
          qty={qty}
          className="btn-lift h-10 min-w-0 flex-1 rounded-full border-2 border-brand text-[13px] font-medium text-brand"
        />
        <WishlistButton product={product} />
      </div>
      {whatsapp && (
        <a
          href={whatsapp}
          className="btn-lift flex h-10 items-center justify-center gap-2 rounded-full border border-line text-xs font-medium uppercase"
        >
          <ChatIcon className="size-4 text-[#15803d]" strokeWidth={2} /> Order on WhatsApp
        </a>
      )}
    </>
  );
}
