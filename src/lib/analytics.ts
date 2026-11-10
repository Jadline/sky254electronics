// Shop events for Google Analytics 4, Google Ads and the Meta Pixel. Each tool is only
// loaded when its ID is set (see components/analytics.tsx), and every call here does
// nothing when a tool isn't loaded, so these are safe to call from anywhere in the browser.

export const ANALYTICS = {
  ga4: process.env.NEXT_PUBLIC_GA4_ID || null,
  googleAds: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || null,
  /** The label of the "Purchase" conversion action in Google Ads (the part after the slash). */
  googleAdsPurchaseLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || null,
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
};

export type TrackedItem = { id: string; name: string; priceKes: number | null; qty?: number; brand?: string | null; category?: string | null };

type ShopEvent =
  | { name: "view_item"; items: TrackedItem[] }
  | { name: "add_to_cart"; items: TrackedItem[] }
  | { name: "begin_checkout"; items: TrackedItem[] }
  | { name: "purchase"; items: TrackedItem[]; orderNumber: string; valueKes: number; shippingKes?: number | null };

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

const META_EVENTS = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" } as const;

const valueOf = (items: TrackedItem[]) => items.reduce((sum, item) => sum + (item.priceKes ?? 0) * (item.qty ?? 1), 0);

/**
 * The tags load after the page is interactive, so an event can come first. Google's queue
 * can be started early (gtag.js reads it when it loads); the Pixel's is made by its own
 * snippet, so Meta events wait for it for a few seconds.
 */
function whenPixelReady(send: (fbq: Fbq) => void, tries = 20) {
  if (!ANALYTICS.metaPixel) return;
  if (window.fbq) send(window.fbq);
  else if (tries > 0) setTimeout(() => whenPixelReady(send, tries - 1), 250);
}

function googleTag(): Gtag | undefined {
  if (!ANALYTICS.ga4 && !ANALYTICS.googleAds) return undefined;
  if (!window.gtag) {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    window.gtag = function gtag() {
      // gtag.js expects the arguments object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

export function track(event: ShopEvent | { name: "page_view"; path: string }) {
  if (typeof window === "undefined") return;
  if (event.name === "page_view") {
    try {
      googleTag()?.("event", "page_view", { page_location: window.location.href, page_path: event.path, page_title: document.title });
      whenPixelReady((fbq) => fbq("track", "PageView"));
    } catch {
      // Tracking must never break the shop.
    }
    return;
  }
  const value = event.name === "purchase" ? event.valueKes : valueOf(event.items);

  try {
    const gtag = googleTag();
    gtag?.("event", event.name, {
      currency: "KES",
      value,
      items: event.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand ?? undefined,
        item_category: item.category ?? undefined,
        price: item.priceKes ?? undefined,
        quantity: item.qty ?? 1,
      })),
      ...(event.name === "purchase" && { transaction_id: event.orderNumber, shipping: event.shippingKes ?? undefined }),
    });

    if (event.name === "purchase" && ANALYTICS.googleAds && ANALYTICS.googleAdsPurchaseLabel) {
      gtag?.("event", "conversion", {
        send_to: `${ANALYTICS.googleAds}/${ANALYTICS.googleAdsPurchaseLabel}`,
        value,
        currency: "KES",
        transaction_id: event.orderNumber,
      });
    }

    whenPixelReady((fbq) =>
      fbq(
        "track",
        META_EVENTS[event.name],
        {
          currency: "KES",
          value,
          content_type: "product",
          content_ids: event.items.map((item) => item.id),
          contents: event.items.map((item) => ({ id: item.id, quantity: item.qty ?? 1 })),
          num_items: event.items.reduce((n, item) => n + (item.qty ?? 1), 0),
        },
        // Lets Meta drop a duplicate if the same order is ever reported twice.
        event.name === "purchase" ? { eventID: event.orderNumber } : undefined,
      ),
    );
  } catch {
    // Tracking must never break the shop.
  }
}
