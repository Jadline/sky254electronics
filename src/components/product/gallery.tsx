"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageSlider } from "@/components/image-slider";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const photos = product.photos;

  return (
    <div className="flex min-w-0 flex-[1_1_480px] gap-5 max-sm:flex-col-reverse">
      {photos.length > 1 && (
        <div className="flex flex-none flex-col gap-3.5 max-sm:flex-row max-sm:flex-wrap">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`relative size-[90px] cursor-pointer border-2 bg-white p-1.5 transition-colors ${i === index ? "border-brand" : "border-line hover:border-muted"}`}
            >
              <span className="relative block size-full">
                <Image src={photo.src} alt="" fill sizes="80px" className={photo.kind === "product" ? "object-contain" : "object-cover"} />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1 border border-line">
        <ImageSlider
          photos={photos}
          index={index}
          onIndexChange={setIndex}
          label={`Photos of ${product.name}`}
          sizes="(max-width: 1024px) 90vw, 640px"
          priority
        />
      </div>
    </div>
  );
}
