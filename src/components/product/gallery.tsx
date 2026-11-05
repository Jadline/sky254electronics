"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const views = [
    product.photo && { key: "product", label: "Product", image: product.photo, fit: "object-contain p-[8%]" },
    product.boxPhoto && { key: "box", label: "In the box", image: product.boxPhoto, fit: "object-cover" },
  ].filter((view) => !!view);
  const [active, setActive] = useState(views[0]?.key);

  return (
    <div className="flex min-w-0 flex-[1_1_480px] gap-5 max-sm:flex-col-reverse">
      {views.length > 1 && (
        <div className="flex flex-none flex-col gap-3.5 max-sm:flex-row">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              aria-pressed={view.key === active}
              onClick={() => setActive(view.key)}
              className={`flex w-[90px] cursor-pointer flex-col items-center gap-0.5 border-2 bg-white p-1.5 transition-colors ${view.key === active ? "border-brand" : "border-line hover:border-muted"}`}
            >
              <span className="relative h-16 w-full">
                <Image
                  src={view.image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className={view.key === "box" ? "object-cover" : "object-contain"}
                />
              </span>
              <span className="text-[10px] text-muted">{view.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square min-w-0 flex-1 overflow-hidden border border-line">
        {views.map((view, i) => (
          <Image
            key={view.key}
            src={view.image.src}
            alt={view.key === active ? view.image.alt : ""}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 90vw, 640px"
            className={`${view.fit} transition-opacity duration-150 ${view.key === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
