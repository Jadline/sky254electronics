"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/card-actions";
import { CloseIcon } from "@/components/icons";
import { toggleWishlist, useShop } from "@/lib/shop-store";
import { priceText, productHref, type Product } from "@/lib/types";

export function WishlistView({ products }: { products: Product[] }) {
  const { wishlist } = useShop();
  const items = wishlist.flatMap((slug) => products.find((p) => p.slug === slug) ?? []);

  if (items.length === 0) {
    return (
      <div className="flex max-w-[1000px] flex-col items-center gap-4 border border-line px-6 py-20 text-center">
        <p className="text-xl font-light">Your wishlist is empty.</p>
        <p className="text-sm text-muted">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn-lift inline-flex h-10 items-center rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1170px] border border-b-0 border-line">
      {items.map((product) => {
        const image = product.photo ?? product.boxPhoto;
        return (
          <div key={product.slug} className="flex flex-wrap items-stretch border-b border-line">
            <div className="flex w-[46px] flex-none items-center justify-center border-r border-line">
              <button
                type="button"
                aria-label={`Remove ${product.name} from wishlist`}
                onClick={() => toggleWishlist(product.slug)}
                className="flex size-9 cursor-pointer items-center justify-center text-muted transition-colors hover:text-text"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <div className="relative w-[110px] flex-none border-r border-line">
              {image && (
                <Image src={image.src} alt="" fill sizes="110px" className={product.photo ? "object-contain p-2.5" : "object-cover"} />
              )}
            </div>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col justify-center gap-2 border-r border-line px-5 py-[18px] max-md:border-r-0">
              <Link href={productHref(product.slug)} className="text-[17px] font-medium transition-colors hover:text-brand">
                {product.name}
              </Link>
              <span className={`text-[17px] font-medium ${product.priceKes == null ? "text-muted" : "text-brand"}`}>
                {priceText(product)}
              </span>
            </div>
            <div className="flex flex-[0_1_300px] flex-col justify-center gap-2.5 px-5 py-[18px] max-md:flex-[1_1_100%]">
              <span className="font-medium">{product.inStock ? "In stock" : "Sold out"}</span>
              <AddToCartButton
                product={product}
                className="btn-lift h-10 self-start rounded-full bg-brand px-[30px] text-[13px] font-medium text-white"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
