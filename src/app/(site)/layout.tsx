import { Suspense } from "react";
import { Analytics } from "@/components/analytics";
import { JsonLd, storeJsonLd } from "@/components/json-ld";
import { LiveUpdates } from "@/components/live-updates";
import { SiteFooter } from "@/components/site-footer";
import { ShopContactProvider } from "@/components/shop-contact";
import { SiteHeader } from "@/components/site-header";
import { getShopSettings } from "@/lib/catalog";
import { shopContact } from "@/lib/contact";

/** Tells Google who runs the shop, where it is and when it's open. */
async function StoreDetails() {
  return <JsonLd data={storeJsonLd(await getShopSettings())} />;
}

/** Gives the client components (cart, product cards) the shop's WhatsApp number from Shop settings. */
async function WithContact({ children }: { children: React.ReactNode }) {
  return <ShopContactProvider contact={shopContact(await getShopSettings())}>{children}</ShopContactProvider>;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreDetails />
      <SiteHeader />
      <WithContact>{children}</WithContact>
      <SiteFooter />
      {/* Shows dashboard changes without a reload. */}
      <LiveUpdates topic="catalog" />
      {/* It reads the current address, which only exists in the browser. */}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </>
  );
}
