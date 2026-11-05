import { PageUnavailable } from "@/components/page-unavailable";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// For URLs that match no page. These sit outside the shop layout, so it adds its own.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <PageUnavailable />
      <SiteFooter />
    </>
  );
}
