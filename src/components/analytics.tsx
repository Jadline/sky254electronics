"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { ANALYTICS, track, type TrackedItem } from "@/lib/analytics";
import { useShop } from "@/lib/shop-store";

/**
 * Loads GA4, Google Ads and the Meta Pixel for whichever IDs are set:
 *   NEXT_PUBLIC_GA4_ID                     e.g. G-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_ID              e.g. AW-123456789
 *   NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL  the conversion label for purchases
 *   NEXT_PUBLIC_META_PIXEL_ID              e.g. 1234567890
 * With none set, nothing loads. Only used on the shop, never in the dashboard.
 *
 * A customer's order page (/order/<token>) is private to whoever has the link, so the
 * tags never load or count a page view there, and the purchase is reported from checkout.
 */

const ID = /^[A-Z0-9-]+$/i;
const isPrivate = (pathname: string) => pathname.startsWith("/order/");

export function Analytics() {
  const pathname = usePathname() ?? "/";
  const { ga4, googleAds, metaPixel } = ANALYTICS;
  const googleIds = [ga4, googleAds].filter((id): id is string => !!id && ID.test(id));
  const pixel = metaPixel && /^\d+$/.test(metaPixel) ? metaPixel : null;
  // Wait for a public page before loading anything. Once loaded, the tags stay loaded.
  const [ready, setReady] = useState(false);
  if (!ready && !isPrivate(pathname)) setReady(true);
  if (!ready || (!googleIds.length && !pixel)) return null;

  return (
    <>
      {googleIds.length > 0 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());` +
              googleIds.map((id) => `gtag('config',${JSON.stringify(id)},{send_page_view:false});`).join("")}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq.disablePushState=true;fbq('set','autoConfig',false,'${pixel}');fbq('init','${pixel}');`}
        </Script>
      )}
      <PageViews pathname={pathname} />
      <CheckoutStart pathname={pathname} />
    </>
  );
}

/** One page view per page, sent here (not automatically) so private pages can be skipped. */
function PageViews({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (isPrivate(pathname)) return;
    track({ name: "page_view", path: pathname });
  }, [pathname]);
  return null;
}

/** Reports the start of checkout with what's in the cart, once per visit to /checkout. */
function CheckoutStart({ pathname }: { pathname: string }) {
  const { cart } = useShop();
  const sent = useRef(false);
  useEffect(() => {
    if (pathname !== "/checkout") {
      sent.current = false;
      return;
    }
    if (!cart.length || sent.current) return;
    sent.current = true;
    track({ name: "begin_checkout", items: cart.map((line) => ({ id: line.slug, name: line.name, priceKes: line.priceKes, qty: line.qty })) });
  }, [pathname, cart]);
  return null;
}

/** Reports that someone looked at a product. */
export function TrackProductView({ item }: { item: TrackedItem }) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (sent.current === item.id) return;
    sent.current = item.id;
    track({ name: "view_item", items: [item] });
  }, [item]);
  return null;
}
