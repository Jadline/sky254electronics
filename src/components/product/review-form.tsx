"use client";

import { useActionState, useState } from "react";
import { submitReview, type ReviewResult } from "@/app/(site)/review-actions";
import { REVIEW_LIMITS } from "@/lib/reviews";

const FIELD = "h-11 w-full border border-line bg-white px-3.5 text-sm text-text outline-none focus:border-brand aria-invalid:border-[#b42318]";
const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** "Write a review" on a product page. Reviews show once the shop approves them. */
export function ReviewForm({ productSlug }: { productSlug: string }) {
  const [result, action, pending] = useActionState<ReviewResult | null, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const invalid = (field: string) => (result && !result.ok && result.field === field ? true : undefined);
  const shown = hover || rating;

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col gap-1.5 bg-tint p-5">
        <p className="font-medium">Review sent</p>
        <p className="text-sm text-body">{result.message}</p>
      </div>
    );
  }

  return (
    <form action={action} aria-labelledby="review-form-h" className="flex flex-col gap-4">
      <h3 id="review-form-h" className="text-base font-medium">Write a review</h3>
      <input type="hidden" name="product" value={productSlug} />
      <fieldset className="flex flex-col gap-1.5" aria-invalid={invalid("rating")}>
        <legend className="mb-1.5 text-[13px] font-medium">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <span className="sr-only">{n} {n === 1 ? "star" : "stars"}</span>
              <svg viewBox="0 0 24 24" aria-hidden className={`size-7 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand ${n <= shown ? "fill-accent" : "fill-line"}`}>
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
              </svg>
            </label>
          ))}
          <span className="ml-2 text-[13px] text-muted">{WORDS[shown]}</span>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Your name
          <input name="name" required maxLength={REVIEW_LIMITS.name} autoComplete="given-name" placeholder="Shown with your review" aria-invalid={invalid("name")} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Phone number
          <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="Never shown" aria-invalid={invalid("phone")} className={FIELD} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Headline <span className="sr-only">(optional)</span>
        <input name="title" maxLength={REVIEW_LIMITS.title} placeholder="Optional, e.g. Great sound for the price" className={FIELD} />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium">
        Your review
        <textarea name="body" required rows={4} minLength={10} maxLength={REVIEW_LIMITS.body} aria-invalid={invalid("body")} className={`${FIELD} h-auto py-3`} />
      </label>
      {/* Hidden from people. Only bots fill this in. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
      <p className="text-xs text-muted">
        Your phone number is only used to mark you as a verified buyer if you ordered this from us. Reviews appear after we check them.
      </p>
      {result && !result.ok && <p role="alert" className="text-sm text-[#b42318]">{result.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-lift h-11 cursor-pointer self-start rounded-full bg-brand px-8 text-[13px] font-medium text-white uppercase disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
