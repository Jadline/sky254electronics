import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

/** /robots.txt: the shop is open to search engines; the dashboard and private pages aren't. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cart", "/checkout", "/order/", "/wishlist", "/track-order"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
