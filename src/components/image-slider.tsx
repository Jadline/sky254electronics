"use client";

import Image from "next/image";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronRightIcon } from "@/components/icons";
import type { GalleryPhoto } from "@/lib/types";

const SWIPE_DISTANCE = 40;

/**
 * Sliding photo viewer: arrows, dots, swipe and arrow keys. The parent owns the
 * current index, so thumbnails elsewhere can stay in step with it.
 */
export function ImageSlider({
  photos,
  index,
  onIndexChange,
  label,
  sizes,
  priority = false,
  dots = "dark",
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
  sizes: string;
  priority?: boolean;
  /** Dot colours: "light" for dark backgrounds. */
  dots?: "light" | "dark";
}) {
  const start = useRef<number | null>(null);
  const count = photos.length;
  const go = (next: number) => onIndexChange((next + count) % count);

  function onPointerDown(event: PointerEvent) {
    start.current = event.clientX;
  }
  function onPointerUp(event: PointerEvent) {
    if (start.current == null) return;
    const distance = event.clientX - start.current;
    start.current = null;
    if (Math.abs(distance) >= SWIPE_DISTANCE) go(index + (distance < 0 ? 1 : -1));
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else return;
    event.preventDefault();
  }

  if (count === 0) return <div className="aspect-square w-full bg-white" />;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={count > 1 ? onKeyDown : undefined}
        className="group/slider relative aspect-square w-full overflow-hidden bg-white outline-offset-2"
      >
        <div
          onPointerDown={count > 1 ? onPointerDown : undefined}
          onPointerUp={count > 1 ? onPointerUp : undefined}
          onPointerCancel={() => (start.current = null)}
          style={{ transform: `translateX(${-index * 100}%)` }}
          className="flex h-full touch-pan-y transition-transform duration-[250ms] ease-out select-none"
        >
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              // Light grey shows while a photo loads, instead of an empty white frame.
              className="relative h-full w-full flex-none bg-[#f5f7fb]"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                draggable={false}
                sizes={sizes}
                priority={priority && i === 0}
                // Off-screen slides sit beside the frame, so load them before they're needed.
                loading={priority && i === 0 ? undefined : "eager"}
                // Contain, not cover: tall or wide shop photos show whole instead of being cropped.
                className={`object-contain ${photo.kind === "product" ? "p-[6%]" : ""}`}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-text shadow-[0_2px_10px_rgba(29,33,40,0.18)] transition-opacity hover:bg-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/slider:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
            >
              <ChevronRightIcon className="size-5 rotate-180" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-text shadow-[0_2px_10px_rgba(29,33,40,0.18)] transition-opacity hover:bg-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/slider:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
            >
              <ChevronRightIcon className="size-5" strokeWidth={2.2} />
            </button>
          </>
        )}
        <p aria-live="polite" className="sr-only">
          Photo {index + 1} of {count}: {photos[index]?.alt}
        </p>
      </div>

      {count > 1 && (
        <div className="flex gap-1">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className="flex h-6 cursor-pointer items-center px-1"
            >
              <span
                className={`h-2 rounded-full transition-all duration-200 ${i === index ? "w-7 bg-brand" : `w-2 ${dots === "light" ? "bg-white/70" : "bg-[#c5cbd6]"}`}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
