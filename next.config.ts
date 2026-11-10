import type { NextConfig } from "next";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

/**
 * Sent with every page. The Content-Security-Policy only covers what can't break the
 * site: no framing by other sites (clickjacking), no <base> or <object> tricks, and
 * forms may only submit here. A full script policy would need a nonce on every
 * request, which would stop pages from being cached.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Browsers ignore this over plain http, so it is harmless in development.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Only our own product bucket, so /_next/image can't be used as an open proxy.
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseUrl.hostname,
        pathname: "/storage/v1/object/public/products/**",
      },
    ],
  },
  async redirects() {
    return [
      // Category pages moved from /shop?category=<slug> to /shop/<slug>. The header search
      // box still sends ?category=, and old links and Google results keep working.
      {
        source: "/shop",
        has: [{ type: "query", key: "category", value: "(?<category>[a-z0-9-]+)" }],
        destination: "/shop/:category",
        permanent: true,
      },
      // There are no customer accounts. Orders are looked up by number and phone.
      { source: "/login", destination: "/track-order", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Keep the dashboard out of search engines, even if a link to it leaks.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
