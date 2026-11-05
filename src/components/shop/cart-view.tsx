"use client";

import Image from "next/image";
import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import { CheckoutSteps } from "@/components/shop/checkout-steps";
import { whatsappLink } from "@/config/site";
import { clearCart, removeFromCart, setCartQty, useShop } from "@/lib/shop-store";
import { formatKes, productHref, type Product } from "@/lib/types";

export function CartView({ products }: { products: Product[] }) {
  const { cart } = useShop();

  // Prices always come from the live catalogue, not from when the item was added.
  const lines = cart.flatMap((line) => {
    const product = products.find((p) => p.slug === line.slug);
    return product && product.inStock && product.priceKes != null
      ? [{ product, qty: line.qty, price: product.priceKes }]
      : [];
  });
  const unavailable = cart.filter((line) => !lines.some((l) => l.product.slug === line.slug));
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  const order = lines.map((l) => `${l.qty} x ${l.product.name}`).join("\n");
  const whatsapp = whatsappLink(`Hi Sky254, I'd like to order:\n${order}\nSubtotal: ${formatKes(subtotal)}`);

  return (
    <div className="flex max-w-[1000px] flex-col gap-[30px]">
      <CheckoutSteps current={0} />

      {unavailable.length > 0 && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 bg-tint px-5 py-4 text-sm">
          <span>
            {unavailable.length === 1 ? "1 item is" : `${unavailable.length} items are`} no longer available:{" "}
            {unavailable.map((line) => line.name).join(", ")}
          </span>
          <button
            type="button"
            onClick={() => unavailable.forEach((line) => removeFromCart(line.slug))}
            className="cursor-pointer font-medium text-brand"
          >
            Remove
          </button>
        </div>
      )}

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-line px-6 py-20 text-center">
          <p className="text-xl font-light">Your cart is empty.</p>
          <Link href="/shop" className="btn-lift inline-flex h-10 items-center rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-[15px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="p-4 font-medium">Image</th>
                  <th scope="col" className="p-4 font-medium">Product name</th>
                  <th scope="col" className="p-4 font-medium">Price</th>
                  <th scope="col" className="p-4 font-medium">Quantity</th>
                  <th scope="col" className="p-4 font-medium">Total</th>
                  <th scope="col" className="p-4"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ product, qty, price }) => {
                  const image = product.photo ?? product.boxPhoto;
                  return (
                    <tr key={product.slug} className="border-b border-line last:border-b-0">
                      <td className="p-4">
                        <span className="relative block size-[110px]">
                          {image && (
                            <Image src={image.src} alt="" fill sizes="110px" className={product.photo ? "object-contain" : "object-cover"} />
                          )}
                        </span>
                      </td>
                      <td className="max-w-[220px] p-4 leading-relaxed">
                        <Link href={productHref(product.slug)} className="transition-colors hover:text-brand">{product.name}</Link>
                      </td>
                      <td className="p-4 font-medium whitespace-nowrap text-brand">{formatKes(price)}</td>
                      <td className="p-4">
                        <div role="group" aria-label={`Quantity for ${product.name}`} className="inline-flex h-10 items-center border border-line">
                          <button type="button" aria-label="Decrease quantity" onClick={() => setCartQty(product.slug, qty - 1)} className="h-full w-[30px] cursor-pointer">−</button>
                          <span className="min-w-[30px] text-center font-medium">{qty}</span>
                          <button type="button" aria-label="Increase quantity" onClick={() => setCartQty(product.slug, qty + 1)} className="h-full w-[30px] cursor-pointer">+</button>
                        </div>
                      </td>
                      <td className="p-4 font-medium whitespace-nowrap text-brand">{formatKes(price * qty)}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          aria-label={`Remove ${product.name}`}
                          onClick={() => removeFromCart(product.slug)}
                          className="flex size-[30px] cursor-pointer items-center justify-center border border-line transition-colors hover:border-text"
                        >
                          <CloseIcon className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-line px-[30px] py-5">
              <Link href="/shop" className="text-sm font-medium text-brand">← Continue shopping</Link>
              <button type="button" onClick={clearCart} className="cursor-pointer text-sm text-muted transition-colors hover:text-text">
                Empty cart
              </button>
            </div>
          </div>

          <div className="border border-line">
            <h2 className="border-b border-line px-[30px] py-[18px] text-center text-[15px] font-medium uppercase">Cart totals</h2>
            <div className="flex flex-col gap-5 px-[30px] pt-6 pb-[30px]">
              <div className="flex flex-wrap justify-between gap-2.5">
                <span className="text-[15px] text-body uppercase">Subtotal</span>
                <span className="text-[19px] text-brand">{formatKes(subtotal)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2.5">
                <span className="text-[15px] text-body uppercase">Delivery</span>
                <span className="text-sm text-body">We&apos;ll confirm this with your order</span>
              </div>
              <Link href="/checkout" className="btn-lift flex h-11 items-center justify-center rounded-full bg-brand text-[13px] font-medium text-white uppercase">
                Proceed to checkout
              </Link>
              {whatsapp && (
                <a href={whatsapp} className="btn-lift flex h-10 items-center justify-center rounded-full border-2 border-text text-[13px] font-medium uppercase">
                  Or send order on WhatsApp
                </a>
              )}
              <span className="text-center text-[13px] text-muted">Pay by M-Pesa or cash on delivery</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
