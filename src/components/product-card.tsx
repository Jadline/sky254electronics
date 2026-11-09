import Image from "next/image";
import Link from "next/link";
import { CardActions } from "@/components/card-actions";
import { QuickView } from "@/components/quick-view";
import { priceText, productHref, type Product } from "@/lib/types";

const CARD_SIZES = "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 320px";

/** Standard grid card: clean photo by default, box photo and actions on hover. */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { photo, boxPhoto } = product;

  return (
    <article
      className="group card-in relative flex flex-col gap-2.5 border border-line bg-white px-5 pt-5 pb-4 transition-[box-shadow,translate] duration-100 focus-within:z-20 hover:z-20 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(29,33,40,0.12)]"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <span className="text-xs tracking-wide text-muted uppercase">{product.category.name}</span>
      <h3 className="min-h-10 text-sm leading-snug font-medium">
        {/* The ::after layer stretches this link over the whole card, so a click anywhere
            opens the product. Buttons on the card sit above it with z-[2]. */}
        <Link
          href={productHref(product.slug)}
          className="line-clamp-2 transition-colors group-hover:text-brand after:absolute after:inset-0 after:z-[1] after:content-['']"
        >
          {product.name}
        </Link>
      </h3>

      <div className="relative aspect-square overflow-hidden bg-white">
        {boxPhoto && (
          <Image
            src={boxPhoto.src}
            alt={photo ? "" : boxPhoto.alt}
            fill
            sizes={CARD_SIZES}
            className={`object-cover transition duration-200 group-hover:scale-105 ${photo ? "opacity-0 group-hover:opacity-100" : ""}`}
          />
        )}
        {photo && (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={CARD_SIZES}
            className="object-contain p-[8%] transition-opacity duration-150 group-hover:opacity-0"
          />
        )}
        {product.badge && (
          <span className="absolute top-0 right-0 rounded-sm bg-accent px-2 py-0.5 text-xs font-medium text-text">
            {product.badge}
          </span>
        )}
        <QuickView product={product} />
      </div>

      <div className="mt-auto flex min-h-[62px] flex-col gap-1 border-t border-line pt-3.5">
        <strong className={`text-base font-medium whitespace-nowrap ${product.priceKes == null ? "text-muted" : "text-brand"}`}>
          {priceText(product)}
        </strong>
        {product.warranty && <span className="text-xs text-muted">{product.warranty}</span>}
      </div>

      <CardActions product={product} />
    </article>
  );
}

/** Compact row for sidebars. */
export function ProductCardMini({ product }: { product: Product }) {
  const image = product.photo ?? product.boxPhoto;
  return (
    <Link
      href={productHref(product.slug)}
      className="flex items-center gap-4 border-b border-line px-[18px] py-4 transition-colors hover:bg-tint"
    >
      <span className="relative size-16 flex-none overflow-hidden">
        {image && (
          <Image src={image.src} alt="" fill sizes="64px" className={product.photo ? "object-contain" : "object-cover"} />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="line-clamp-2 text-sm leading-snug font-medium">{product.name}</span>
        <span className={`text-[15px] font-medium ${product.priceKes == null ? "text-muted" : "text-brand"}`}>
          {priceText(product)}
        </span>
      </span>
    </Link>
  );
}

/** Wide row with the photo on the left. */
export function ProductCardRow({ product }: { product: Product }) {
  const image = product.photo ?? product.boxPhoto;
  return (
    <Link
      href={productHref(product.slug)}
      className="flex h-full items-center gap-5 border border-line p-5 transition-colors hover:border-text"
    >
      <span className="relative size-[110px] flex-none overflow-hidden">
        {image && (
          <Image src={image.src} alt="" fill sizes="110px" className={product.photo ? "object-contain" : "object-cover"} />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="text-xs text-muted uppercase">{product.category.name}</span>
        <span className="text-sm leading-snug font-medium">{product.name}</span>
        <span className={`text-base font-medium ${product.priceKes == null ? "text-muted" : "text-brand"}`}>
          {priceText(product)}
        </span>
      </span>
    </Link>
  );
}
