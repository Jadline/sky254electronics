import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { TrackOrderForm } from "@/components/shop/track-order-form";
import { site, whatsappLink } from "@/config/site";

export const metadata: Metadata = {
  title: "Track my order",
  description: "Check the progress of your Sky254 Electronics order with your order number and phone number.",
};

export default function TrackOrderPage() {
  const whatsapp = whatsappLink("Hi Sky254, I'd like to check on my order.");
  return (
    <>
      <PageHeading title="Track my order" />
      <main className="mx-auto w-full max-w-[1860px] px-6 pt-[50px] pb-[90px] lg:pl-[324px]">
        <div className="flex max-w-[1000px] flex-wrap items-start gap-[30px]">
          <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 border border-line p-6">
            <div>
              <h2 className="text-[15px] font-medium uppercase">Find your order</h2>
              <p className="mt-1.5 text-sm text-body">
                Enter the order number from your confirmation (it starts with SKY-) and the phone number you ordered with.
              </p>
            </div>
            <TrackOrderForm />
          </section>
          <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 bg-tint p-6 text-sm">
            <h2 className="text-[15px] font-medium uppercase">Can&apos;t find it?</h2>
            <p className="text-body">Call us on {site.phone} and we&apos;ll check for you.</p>
            {whatsapp && (
              <a href={whatsapp} className="font-medium text-brand">
                Message us on WhatsApp
              </a>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
