"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type HeroSlide = {
  label: string;
  title: string;
  strong: string;
  price: string;
  href: string;
  image: { src: string; alt: string };
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (!paused.current) setActive((current) => (current + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      className="relative flex min-h-[420px] min-w-0 flex-[1_1_440px] flex-col overflow-hidden bg-tint px-10 pt-14 pb-10 max-sm:min-h-[330px] max-sm:px-5 max-sm:pb-4"
    >
      {slides.map((slide, i) => {
        const on = i === active;
        return (
          <div
            key={slide.href}
            aria-hidden={!on}
            className={`absolute inset-0 flex flex-col bg-tint px-10 pt-14 pb-10 transition-[opacity,visibility] duration-300 max-sm:px-5 max-sm:pt-9 ${on ? "visible opacity-100" : "invisible opacity-0"}`}
          >
            <div className="relative z-10 flex flex-col items-start">
              <span className={`text-xs font-medium tracking-[0.12em] text-brand uppercase transition-transform duration-300 ${on ? "" : "translate-y-3.5"}`}>
                {slide.label}
              </span>
              <h2 className={`mt-4 max-w-[52%] text-[44px] leading-[1.1] font-light transition-transform duration-[350ms] max-sm:text-3xl ${on ? "" : "translate-y-3.5"}`}>
                {slide.title} <strong className="font-semibold">{slide.strong}</strong>
              </h2>
              <span className={`mt-4 text-[22px] font-medium text-brand transition-transform duration-[400ms] ${on ? "" : "translate-y-3.5"}`}>
                {slide.price}
              </span>
              <Link
                href={slide.href}
                tabIndex={on ? undefined : -1}
                className="btn-lift mt-[22px] inline-flex h-10 items-center rounded-full border-2 border-brand px-[26px] text-[13px] font-medium text-brand uppercase"
              >
                Shop now
              </Link>
            </div>
            <div className="absolute right-6 bottom-12 h-[72%] w-[46%] max-sm:right-3 max-sm:bottom-10 max-sm:h-[62%]">
              <Image
                src={slide.image.src}
                alt={slide.image.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 900px) 46vw, 420px"
                className="float object-contain mix-blend-multiply"
              />
            </div>
          </div>
        );
      })}

      <div className="relative z-10 mt-auto flex gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.href}
            type="button"
            aria-label={`Show slide ${i + 1}: ${slide.title} ${slide.strong}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className="flex h-6 min-w-6 cursor-pointer items-center justify-center"
          >
            <span className={`h-2 rounded-full transition-all duration-200 ${i === active ? "w-5 bg-brand" : "w-2 bg-[#c5cbd6]"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
