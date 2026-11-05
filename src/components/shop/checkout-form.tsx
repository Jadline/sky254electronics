"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder } from "@/app/(site)/checkout/actions";
import { CheckoutSteps } from "@/components/shop/checkout-steps";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/lib/order-labels";
import { clearCart, useShop } from "@/lib/shop-store";
import { formatKes, type Product } from "@/lib/types";

const FIELD = "h-11 w-full border border-line bg-white px-3.5 text-sm font-normal outline-none transition-colors focus:border-brand";

export function CheckoutForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const { cart } = useShop();
  const [method, setMethod] = useState<DeliveryMethod>("nairobi");
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();

  // Totals shown here use live prices. The server recalculates them again when ordering.
  const lines = cart.flatMap((line) => {
    const product = products.find((p) => p.slug === line.slug);
    return product && product.inStock && product.priceKes != null
      ? [{ product, qty: line.qty, price: product.priceKes }]
      : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const unavailable = cart.length - lines.length;

  if (lines.length === 0 && !placed) {
    return (
      <div className="flex max-w-[1000px] flex-col gap-[30px]">
        <CheckoutSteps current={1} />
        <div className="flex flex-col items-center gap-4 border border-line px-6 py-20 text-center">
          <p className="text-xl font-light">
            {cart.length > 0 ? "The items in your cart are no longer available." : "Your cart is empty."}
          </p>
          {error && <p role="alert" className="text-sm text-[#b42318]">{error.message}</p>}
          <Link
            href={cart.length > 0 ? "/cart" : "/shop"}
            className="btn-lift inline-flex h-10 items-center rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase"
          >
            {cart.length > 0 ? "Review cart" : "Continue shopping"}
          </Link>
        </div>
      </div>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        items: lines.map((line) => ({ slug: line.product.slug, qty: line.qty })),
        expectedSubtotal: subtotal,
        name: value("name"),
        phone: value("phone"),
        email: value("email"),
        deliveryMethod: method,
        address: value("address"),
        notes: value("notes"),
        website: value("website"),
      });
      if (result.ok) {
        setPlaced(true);
        clearCart();
        router.push(`/order/${result.token}`);
      } else {
        setError({ message: result.error, field: result.field });
        router.refresh();
      }
    });
  }

  const invalid = (field: string) => error?.field === field;

  return (
    <div className="flex max-w-[1000px] flex-col gap-[30px]">
      <CheckoutSteps current={1} />

      {unavailable > 0 && (
        <p role="status" className="bg-tint px-5 py-4 text-sm">
          {unavailable === 1 ? "1 item in your cart is" : `${unavailable} items in your cart are`} no longer available and won&apos;t be included.{" "}
          <Link href="/cart" className="font-medium text-brand">Review cart</Link>
        </p>
      )}

      <form onSubmit={submit} className="flex flex-wrap items-start gap-[30px]" noValidate>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[30px]">
          <fieldset className="flex flex-col gap-4 border border-line p-6">
            <legend className="px-2 text-[15px] font-medium uppercase">Your details</legend>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Full name
              <input name="name" required autoComplete="name" maxLength={100} aria-invalid={invalid("name")} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Phone number
              <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0712 345 678" maxLength={20} aria-invalid={invalid("phone")} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email <span className="sr-only">(optional)</span>
              <input name="email" type="email" autoComplete="email" placeholder="Optional" maxLength={200} aria-invalid={invalid("email")} className={FIELD} />
            </label>
            {/* Hidden from people. Only bots fill this in. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 border border-line p-6">
            <legend className="px-2 text-[15px] font-medium uppercase">How to get your order</legend>
            {(Object.entries(DELIVERY_METHODS) as [DeliveryMethod, (typeof DELIVERY_METHODS)[DeliveryMethod]][]).map(([key, option]) => (
              <label key={key} className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${method === key ? "border-brand bg-tint" : "border-line"}`}>
                <input
                  type="radio"
                  name="delivery"
                  value={key}
                  checked={method === key}
                  onChange={() => setMethod(key)}
                  className="mt-0.5 size-4 accent-brand"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
            {DELIVERY_METHODS[method].needsAddress && (
              <label className="mt-1 flex flex-col gap-1.5 text-sm font-medium">
                {method === "nairobi" ? "Area and building" : "Town and courier office, or address"}
                <textarea name="address" rows={2} maxLength={300} aria-invalid={invalid("address")} className={`${FIELD} !h-auto py-2.5`} />
              </label>
            )}
            <label className="mt-1 flex flex-col gap-1.5 text-sm font-medium">
              Order notes <span className="sr-only">(optional)</span>
              <textarea name="notes" rows={2} maxLength={500} placeholder="Optional" className={`${FIELD} !h-auto py-2.5`} />
            </label>
          </fieldset>
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 border border-line p-6">
          <h2 className="text-[15px] font-medium uppercase">Your order</h2>
          <ul className="flex flex-col gap-3.5">
            {lines.map(({ product, qty, price }) => {
              const image = product.photo ?? product.boxPhoto;
              return (
                <li key={product.slug} className="flex items-center gap-3">
                  <span className="relative size-14 flex-none">
                    {image && <Image src={image.src} alt="" fill sizes="56px" className={product.photo ? "object-contain" : "object-cover"} />}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] leading-snug">
                    {product.name}
                    <span className="block text-muted">Qty {qty}</span>
                  </span>
                  <span className="text-[13px] font-medium whitespace-nowrap">{formatKes(price * qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-body">Subtotal</span>
              <span className="font-medium">{formatKes(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-body">Delivery</span>
              <span className="text-right text-body">{method === "pickup" ? "Free" : "We'll confirm this"}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <span className="font-medium">Total to pay</span>
              <span className="text-xl font-medium text-brand">{formatKes(subtotal)}</span>
            </div>
            {method !== "pickup" && <p className="text-xs text-muted">Plus delivery, which we&apos;ll confirm when we call you.</p>}
          </div>

          <div className="bg-tint p-4 text-[13px] leading-relaxed">
            <strong className="font-medium">Payment:</strong> nothing to pay now. We&apos;ll call you to confirm your order, then you can pay by M-Pesa or cash
            {method === "countrywide" ? " before we send it." : " when you receive it."}
          </div>

          {error && (
            <p role="alert" className="text-sm text-[#b42318]">{error.message}</p>
          )}
          <button type="submit" disabled={pending || placed} className="btn-lift h-11 cursor-pointer rounded-full bg-brand text-[13px] font-medium text-white uppercase disabled:cursor-not-allowed disabled:opacity-60">
            {pending || placed ? "Placing your order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
