"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { placeOrder } from "@/app/(site)/checkout/actions";
import { previewCoupon } from "@/app/(site)/checkout/coupon-actions";
import { CheckoutSteps } from "@/components/shop/checkout-steps";
import { choiceFee, findChoice, type DeliveryChoice, type DeliveryChoices } from "@/lib/delivery";
import { clearCart, useShop } from "@/lib/shop-store";
import { track } from "@/lib/analytics";
import { normalisePhone } from "@/lib/order-labels";
import { formatKes, type Product } from "@/lib/types";

const FIELD =
  "h-11 w-full border border-line bg-white px-3.5 text-sm font-normal outline-none transition-colors focus:border-brand aria-[invalid=true]:border-[#b42318]";
/** Fields whose errors show under the field itself, not by the Place order button. */
const INLINE_FIELDS = ["name", "phone", "email", "address"];

export function CheckoutForm({ products, delivery, shopPhone }: { products: Product[]; delivery: DeliveryChoices; shopPhone: string }) {
  const router = useRouter();
  const { cart } = useShop();
  const firstChoice = delivery.options[0] ? `option:${delivery.options[0].id}` : delivery.pickupPoints[0] ? `pickup:${delivery.pickupPoints[0].id}` : "";
  const [picked, setSelected] = useState(firstChoice);
  // If the picked option is switched off while the page is open, fall back to the first one.
  const selected = findChoice(delivery, picked) ? picked : firstChoice;
  const choice = findChoice(delivery, selected);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  // Kept in state so it survives switching to pickup and back, which unmounts the box.
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; label: string; discountKes: number; forSubtotal: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, startCouponCheck] = useTransition();

  // Totals shown here use live prices. The server recalculates them again when ordering.
  const lines = cart.flatMap((line) => {
    const product = products.find((p) => p.slug === line.slug);
    return product && product.inStock && product.priceKes != null
      ? [{ product, qty: line.qty, price: product.priceKes }]
      : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  // A coupon was checked for one subtotal. If the cart changes, it has to be applied again.
  const activeCoupon = coupon && coupon.forSubtotal === subtotal ? coupon : null;
  const discount = activeCoupon?.discountKes ?? 0;
  const payable = subtotal - discount;
  // Free delivery is judged on what's paid after the coupon, as the server does.
  const fee = choice ? choiceFee(choice, payable, delivery.freeOver) : null;
  const feeText = (c: DeliveryChoice) => {
    const value = choiceFee(c, payable, delivery.freeOver);
    if (value == null) return "Fee confirmed when we call";
    return value === 0 ? "Free" : formatKes(value);
  };
  const needsAddress = choice?.kind === "option";
  const courier = choice?.kind === "option" && !choice.option.ownRider;
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

  function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    const phone = (formRef.current?.elements.namedItem("phone") as HTMLInputElement | null)?.value ?? "";
    setCouponError(null);
    startCouponCheck(async () => {
      const result = await previewCoupon(code, subtotal, phone);
      if (result.ok) {
        setCoupon({ code: result.code, label: result.label, discountKes: result.discountKes, forSubtotal: subtotal });
        setCouponInput(result.code);
      } else {
        setCoupon(null);
        setCouponError(result.error);
      }
    });
  }

  /** Shows an error and, for a field, moves the cursor to it so it's seen on phones too. */
  function fail(message: string, field?: string) {
    setError({ message, field });
    if (field && INLINE_FIELDS.includes(field)) {
      const element = formRef.current?.elements.namedItem(field);
      if (element instanceof HTMLElement) {
        element.focus();
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    setError(null);

    // The same checks the server makes, so simple slips are caught without a round trip.
    const email = value("email").trim();
    if (value("name").trim().length < 2) return fail("Please enter your name.", "name");
    if (!normalisePhone(value("phone").trim())) return fail("Please enter a valid Kenyan phone number, like 0712 345 678.", "phone");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("That email address doesn't look right.", "email");
    if (needsAddress && address.trim().length < 3) return fail("Please tell us where to deliver.", "address");

    startTransition(async () => {
      const result = await placeOrder({
        items: lines.map((line) => ({ slug: line.product.slug, qty: line.qty })),
        expectedSubtotal: subtotal,
        name: value("name"),
        phone: value("phone"),
        email: value("email"),
        delivery: selected,
        address: needsAddress ? address : "",
        notes: value("notes"),
        couponCode: activeCoupon?.code,
        expectedDiscount: activeCoupon?.discountKes,
        website: value("website"),
      });
      if (result.ok) {
        // Reported here, not on the order page, so its private link never reaches Google or Meta.
        track({
          name: "purchase",
          orderNumber: result.orderNumber,
          // Analytics wants the goods value; delivery goes separately as shipping.
          valueKes: payable,
          shippingKes: fee,
          items: lines.map((line) => ({
            id: line.product.slug,
            name: line.product.name,
            priceKes: line.price,
            qty: line.qty,
            brand: line.product.brand,
            category: line.product.category.name,
          })),
        });
        setPlaced(true);
        clearCart();
        router.push(`/order/${result.token}`);
      } else {
        fail(result.error, result.field);
        if (result.field === "coupon") setCoupon(null);
        router.refresh();
      }
    });
  }

  const invalid = (field: string) => error?.field === field;
  /** Links a field to its error message, when it has one. */
  const describe = (field: string) => (invalid(field) ? { "aria-describedby": `${field}-error` } : {});
  const fieldError = (field: string) =>
    invalid(field) && (
      <span id={`${field}-error`} role="alert" className="text-xs font-normal text-[#b42318]">
        {error!.message}
      </span>
    );
  const clearIf = (field: string) => () => invalid(field) && setError(null);

  return (
    <div className="flex max-w-[1000px] flex-col gap-[30px]">
      <CheckoutSteps current={1} />

      {unavailable > 0 && (
        <p role="status" className="bg-tint px-5 py-4 text-sm">
          {unavailable === 1 ? "1 item in your cart is" : `${unavailable} items in your cart are`} no longer available and won&apos;t be included.{" "}
          <Link href="/cart" className="font-medium text-brand">Review cart</Link>
        </p>
      )}

      <form ref={formRef} onSubmit={submit} className="flex flex-wrap items-start gap-[30px] max-sm:gap-5" noValidate>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[30px] max-sm:gap-5">
          {/* min-w-0: a fieldset is min-content wide by default, which pushed it off narrow screens. */}
          <fieldset className="flex min-w-0 flex-col gap-4 border border-line p-6 max-sm:px-4 max-sm:pt-3 max-sm:pb-4">
            <legend className="px-2 text-[15px] font-medium uppercase">Your details</legend>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Full name
              <input name="name" required autoComplete="name" maxLength={100} aria-invalid={invalid("name")} {...describe("name")} onInput={clearIf("name")} className={FIELD} />
              {fieldError("name")}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Phone number
              <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0712 345 678" maxLength={20} aria-invalid={invalid("phone")} {...describe("phone")} onInput={clearIf("phone")} className={FIELD} />
              {fieldError("phone")}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email <span className="sr-only">(optional)</span>
              <input name="email" type="email" autoComplete="email" placeholder="Optional, for order updates" maxLength={200} aria-invalid={invalid("email")} {...describe("email")} onInput={clearIf("email")} className={FIELD} />
              {fieldError("email")}
            </label>
            {/* Hidden from people. Only bots fill this in. */}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3 border border-line p-6 max-sm:px-4 max-sm:pt-3 max-sm:pb-4">
            <legend className="px-2 text-[15px] font-medium uppercase">How to get your order</legend>
            {!firstChoice && (
              <p className="text-sm text-body">Delivery isn&apos;t set up yet. Please call us on {shopPhone} to order.</p>
            )}
            {delivery.options.length > 0 && (
              <div role="radiogroup" aria-label="Delivery" className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted uppercase">Delivery</span>
                {delivery.options.map((option) => {
                  const value = `option:${option.id}`;
                  return (
                    <ChoiceRow
                      key={value}
                      value={value}
                      selected={selected === value}
                      onSelect={setSelected}
                      title={option.name}
                      detail={[option.areas, option.town].filter(Boolean).join(" · ")}
                      price={feeText({ kind: "option", option })}
                    />
                  );
                })}
              </div>
            )}
            {delivery.pickupPoints.length > 0 && (
              <div role="radiogroup" aria-label="Pickup" className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted uppercase">Pick up</span>
                {delivery.pickupPoints.map((point) => {
                  const value = `pickup:${point.id}`;
                  return (
                    <ChoiceRow
                      key={value}
                      value={value}
                      selected={selected === value}
                      onSelect={setSelected}
                      title={point.name}
                      detail={[point.address, point.hours].filter(Boolean).join(" · ")}
                      price="Free"
                    />
                  );
                })}
              </div>
            )}
            {needsAddress && (
              <label className="mt-1 flex flex-col gap-1.5 text-sm font-medium">
                {courier ? "Town and courier office, or address" : "Area and building"}
                <textarea
                  name="address"
                  rows={2}
                  maxLength={300}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (invalid("address")) setError(null);
                  }}
                  aria-invalid={invalid("address")}
                  {...describe("address")}
                  className={`${FIELD} !h-auto py-2.5`}
                />
                {fieldError("address")}
              </label>
            )}
            <label className="mt-1 flex flex-col gap-1.5 text-sm font-medium">
              Order notes <span className="sr-only">(optional)</span>
              <textarea name="notes" rows={2} maxLength={500} placeholder="Optional" className={`${FIELD} !h-auto py-2.5`} />
            </label>
          </fieldset>
        </div>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 border border-line p-6 max-sm:p-4">
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
            {activeCoupon && (
              <div className="flex justify-between gap-3">
                <span className="text-body">
                  Coupon <strong className="font-medium text-text">{activeCoupon.code}</strong>
                  <span className="block text-xs text-muted">{activeCoupon.label}</span>
                </span>
                <span className="font-medium text-[#15803d]">−{formatKes(discount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-body">Delivery</span>
              <span className="text-right text-body">{fee === 0 ? "Free" : fee == null ? "We'll confirm this" : formatKes(fee)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <span className="font-medium">Total to pay</span>
              <span className="text-xl font-medium text-brand">{formatKes(payable + (fee ?? 0))}</span>
            </div>
            {fee == null && <p className="text-xs text-muted">Plus delivery, which we&apos;ll confirm when we call you.</p>}
            {fee != null && fee > 0 && delivery.freeOver != null && (
              <p className="text-xs text-muted">Free delivery on orders of {formatKes(delivery.freeOver)} or more.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="coupon" className="text-sm font-medium">Coupon code</label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponError(null);
                }}
                onKeyDown={(e) => {
                  // Enter applies the code instead of placing the order.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={30}
                placeholder="Optional"
                aria-invalid={!!couponError || invalid("coupon")}
                aria-describedby="coupon-help"
                className={`${FIELD} min-w-0 flex-1 uppercase placeholder:normal-case`}
              />
              {activeCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                  }}
                  className="h-11 cursor-pointer border border-line px-4 text-[13px] font-medium uppercase hover:border-brand hover:text-brand"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={checkingCoupon || !couponInput.trim()}
                  className="h-11 cursor-pointer border border-brand px-4 text-[13px] font-medium text-brand uppercase hover:bg-tint disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingCoupon ? "Checking…" : "Apply"}
                </button>
              )}
            </div>
            <p id="coupon-help" role={couponError ? "alert" : undefined} className={`text-xs ${couponError ? "text-[#b42318]" : "text-muted"}`}>
              {couponError ??
                (coupon && !activeCoupon
                  ? "Your cart changed. Apply your code again."
                  : "Coupons apply to the prices shown, including items already on offer.")}
            </p>
          </div>

          <div className="bg-tint p-4 text-[13px] leading-relaxed">
            <strong className="font-medium">Payment:</strong> nothing to pay now. We&apos;ll call to confirm your order, then{" "}
            {courier ? "you pay by M-Pesa before we send it." : choice?.kind === "pickup" ? "you pay by M-Pesa or cash when you collect." : "you pay by M-Pesa or cash on delivery."}
          </div>

          {error && !INLINE_FIELDS.includes(error.field ?? "") && (
            <p role="alert" className="text-sm text-[#b42318]">{error.message}</p>
          )}
          <button type="submit" disabled={pending || placed || !choice} className="btn-lift h-11 cursor-pointer rounded-full bg-brand text-[13px] font-medium text-white uppercase disabled:cursor-not-allowed disabled:opacity-60">
            {pending || placed ? "Placing your order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** One delivery option or pickup point to choose. */
function ChoiceRow({
  value,
  selected,
  onSelect,
  title,
  detail,
  price,
}: {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  title: string;
  detail: string;
  price: string;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${selected ? "border-brand bg-tint" : "border-line"}`}>
      <input type="radio" name="delivery" value={value} checked={selected} onChange={() => onSelect(value)} className="mt-0.5 size-4 flex-none accent-brand" />
      {/* Phones: the price drops under the name instead of squeezing it into a narrow column. */}
      <span className="flex min-w-0 flex-1 items-start gap-3 max-sm:flex-col max-sm:gap-1">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          {detail && <span className="text-xs text-muted">{detail}</span>}
        </span>
        <span className="text-right text-xs font-medium whitespace-nowrap max-sm:text-left max-sm:text-brand">{price}</span>
      </span>
    </label>
  );
}
