"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AddToCartButton } from "@/components/card-actions";
import { CloseIcon } from "@/components/icons";
import { ImageSlider } from "@/components/image-slider";
import { categoryHref, priceText, type Product } from "@/lib/types";
import { WasPrice } from "@/components/was-price";
import { priceTone } from "@/lib/pricing";

export function QuickView({ product }: { product: Product }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [slide, setSlide] = useState(0);
  const [qty, setQty] = useState(1);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened(true);
          setSlide(0);
          dialog.current?.showModal();
        }}
        className="absolute inset-x-0 bottom-0 z-[2] h-10 cursor-pointer bg-tint text-[13px] font-medium uppercase opacity-0 transition-opacity duration-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:top-0 [@media(hover:none)]:right-auto [@media(hover:none)]:bottom-auto [@media(hover:none)]:h-7 [@media(hover:none)]:rounded-sm [@media(hover:none)]:px-2.5 [@media(hover:none)]:text-[11px] [@media(hover:none)]:opacity-100"
      >
        Quick view
      </button>

      <dialog
        ref={dialog}
        aria-label={`Quick view: ${product.name}`}
        // Clicking the dimmed area around the panel closes it.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
        className="m-auto w-[calc(100%-32px)] max-w-[1100px] bg-white p-0 text-text"
      >
        {opened && (
          <div className="relative flex flex-wrap">
            <div className="flex flex-[1_1_380px] flex-col items-center gap-4 bg-[#262a35] p-[30px] max-sm:p-4">
              <ImageSlider
                photos={product.photos}
                index={slide}
                onIndexChange={setSlide}
                label={`Photos of ${product.name}`}
                sizes="(max-width: 800px) 90vw, 500px"
                dots="light"
              />
            </div>

            <div className="flex flex-[1_1_380px] flex-col gap-[18px] p-[30px] max-sm:p-5">
              <h2 className="pr-12 text-3xl leading-tight font-medium text-brand max-sm:text-2xl">{product.name}</h2>
              <strong className={`text-2xl font-medium ${priceTone(product)}`}>
                {priceText(product)}
              </strong>
              <WasPrice product={product} className="-mt-3" />
              <ul className="flex flex-col gap-2 text-[15px] leading-relaxed text-body">
                {product.brand && <li>– Brand: {product.brand}</li>}
                {product.warranty && <li>– {product.warranty}</li>}
                <li>– Pay by M-Pesa or cash on delivery</li>
                <li>– Same-day delivery within Nairobi</li>
              </ul>
              <label className="flex items-center gap-3.5 text-sm text-body">
                Quantity:
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={qty}
                  onChange={(event) => setQty(Math.min(9, Math.max(1, Number(event.target.value) || 1)))}
                  className="h-10 w-24 border border-line px-4 text-[15px] font-medium"
                />
              </label>
              <AddToCartButton
                product={product}
                qty={qty}
                className="btn-lift h-10 rounded-full border-2 border-brand text-[13px] font-medium text-brand"
              />
              <div className="my-1.5 h-px bg-line" />
              <span className="text-[15px] text-body">
                Category:{" "}
                <Link href={categoryHref(product.category.slug)} className="text-brand">
                  {product.category.name}
                </Link>
              </span>
            </div>

            <button
              type="button"
              aria-label="Close quick view"
              onClick={() => dialog.current?.close()}
              className="absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center bg-brand text-white transition-colors hover:bg-brand-dark"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
