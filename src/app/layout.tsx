import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";
import { siteUrl } from "@/config/site";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const description =
  "Phones, TVs, fridges, CCTV and accessories in Nairobi. Pay with M-Pesa, with same-day delivery in Nairobi.";

export const metadata: Metadata = {
  // Relative links in metadata (canonical, Open Graph) are made absolute with this.
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sky254 Electronics",
    template: "%s | Sky254 Electronics",
  },
  description,
  // Each page sets its own canonical link (alternates.canonical).
  openGraph: {
    type: "website",
    siteName: "Sky254 Electronics",
    locale: "en_KE",
    title: "Sky254 Electronics",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rubik.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        {/* CookieYes consent banner. It loads before the analytics tags so it can hold them back until the visitor agrees. */}
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/72604d4879e68a40015de4f9cf4cde4f/script.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
