import Image from "next/image";
import { productImageUrl } from "@/lib/storage";

// Temporary starter page: confirms the font, colours and product images work.
// Replace it with the real home page from the design canvas.
export default function Home() {
  return (
    <>
      <div className="bg-ink px-6 py-2 text-center text-xs text-white uppercase">
        Same-day delivery in Nairobi ·{" "}
        <span className="text-accent">Pay with M-Pesa</span>
      </div>
      <main className="mx-auto flex w-full max-w-[1860px] flex-1 flex-wrap items-center justify-center gap-12 px-6 py-16">
        <div className="max-w-md">
          <p className="text-3xl font-bold tracking-tight">
            Sky<span className="text-brand">254</span>
          </p>
          <h1 className="mt-6 text-4xl font-light">
            Development environment <strong className="font-semibold">ready</strong>
          </h1>
          <p className="mt-4 text-muted">
            Next.js, Tailwind, the Rubik font and the Sky254 colours are set up.
          </p>
        </div>
        <div className="bg-tint p-8">
          <Image
            src={productImageUrl("samsung-galaxy-s26-ultra-8gb-256gb/product.webp")}
            alt="Samsung Galaxy S26 Ultra"
            width={320}
            height={320}
            priority
            className="size-80 object-contain mix-blend-multiply"
          />
        </div>
      </main>
    </>
  );
}
