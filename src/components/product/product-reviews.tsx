import { ReviewForm } from "@/components/product/review-form";
import { Stars } from "@/components/product/stars";
import type { ReviewSummary } from "@/lib/reviews";

const dateText = (iso: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(new Date(iso));

/** The reviews panel on a product page: the average, each approved review, and the form. */
export function ProductReviews({ productSlug, summary }: { productSlug: string; summary: ReviewSummary }) {
  const counts = [5, 4, 3, 2, 1].map((stars) => ({ stars, n: summary.reviews.filter((r) => r.rating === stars).length }));

  return (
    <div className="flex flex-wrap items-start gap-x-[50px] gap-y-8">
      <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
        {summary.count === 0 ? (
          <p className="text-sm text-body">No reviews yet. Bought this from us? Tell other customers what you think.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex flex-col items-start gap-1">
                <span className="text-4xl font-light">{summary.average.toFixed(1)}</span>
                <Stars rating={summary.average} />
                <span className="text-xs text-muted">{summary.count} {summary.count === 1 ? "review" : "reviews"}</span>
              </div>
              <ul className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-muted" aria-label="Ratings breakdown">
                {counts.map(({ stars, n }) => (
                  <li key={stars} className="flex items-center gap-2">
                    <span className="w-10">{stars} star</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <span className="block h-full bg-accent" style={{ width: `${(n / summary.count) * 100}%` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="flex flex-col divide-y divide-line border-t border-line">
              {summary.reviews.slice(0, 30).map((review) => (
                <li key={review.id} className="flex flex-col gap-1.5 py-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars rating={review.rating} className="size-3.5" />
                    {review.title && <strong className="text-sm font-medium">{review.title}</strong>}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-body">{review.body}</p>
                  <p className="text-xs text-muted">
                    {review.name}
                    {review.verified && <span className="font-medium text-[#15803d]"> · Verified buyer</span>} · {dateText(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="min-w-0 flex-[1_1_360px] border border-line p-6">
        <ReviewForm productSlug={productSlug} />
      </div>
    </div>
  );
}
