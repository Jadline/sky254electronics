import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sky254 Electronics",
    template: "%s | Sky254 Electronics",
  },
  description:
    "Phones, TVs, fridges, CCTV and accessories in Nairobi. Pay with M-Pesa, with same-day delivery in Nairobi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${rubik.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
