// Limits on what the dashboard can put on the Home page, so its layout always holds.
// Used by the product form (to explain) and by the server action (to enforce).

/** The labels a product card can show on its photo. */
export const BADGES = ["New", "Hot", "Sale", "Limited"] as const;

/** The slider and banners are sized for short titles, like "Galaxy S26 Ultra". */
export const SHORT_NAME_MAX = 24;

/** Slides in the Home page slider. */
export const MAX_SLIDER = 5;

/** One side banner plus a row of three. */
export const MAX_BANNERS = 4;
