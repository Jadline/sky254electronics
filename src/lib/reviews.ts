/** Approved product reviews, as the shop shows them. */
export type Review = {
  id: string;
  productSlug: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string;
};

export type ReviewSummary = { count: number; average: number; reviews: Review[] };

export const REVIEW_LIMITS = { name: 60, title: 100, body: 2000 };

export function summarise(reviews: Review[]): ReviewSummary {
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0;
  return { count, average, reviews };
}
