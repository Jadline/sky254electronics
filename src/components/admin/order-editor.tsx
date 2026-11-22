"use client";

import { useActionState, useState } from "react";
import { updateOrder, type FormState } from "@/app/admin/actions";
import { buttonClass, FIELD, FormMessage, ksh } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";
import { ORDER_STATUS, PAID_VIA, STATUS_ORDER, type DeliveryMethod, type OrderStatus } from "@/lib/admin/orders";

/** Status, delivery fee and the payment record (how it was paid, and the M-Pesa code), saved together. */
export function OrderEditor({
  id,
  status,
  delivery,
  deliveryFee,
  subtotal,
  isCash,
  canMarkPaid,
  isPaid,
  paidVia,
  paymentReference,
  paymentLabel,
}: {
  id: string;
  status: OrderStatus;
  delivery: DeliveryMethod;
  deliveryFee: number | null;
  subtotal: number;
  isCash: boolean;
  /** False once Pesapal has a payment on the order: then Pesapal decides whether it's paid. */
  canMarkPaid: boolean;
  isPaid: boolean;
  /** How it was paid, if recorded. */
  paidVia: string | null;
  /** The M-Pesa confirmation code, if recorded. */
  paymentReference: string | null;
  paymentLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrder, {});
  const onSubmit = useKeepValues(action);
  const missingFee = delivery !== "pickup" && deliveryFee == null;
  // Marking paid reveals how it was paid and, for M-Pesa, the confirmation code from the M-Pesa message.
  const [paid, setPaid] = useState(isPaid);
  const [via, setVia] = useState(paidVia === "mpesa" || paidVia === "cash" || paidVia === "other" ? paidVia : isCash ? "cash" : "mpesa");

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-5 py-[18px]">
      <h2 className="text-lg font-semibold">Manage order</h2>
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Status
        <select name="status" defaultValue={status} className={`${FIELD} font-normal`}>
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {value === "pending" ? "New (not yet confirmed)" : ORDER_STATUS[value].label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {delivery === "pickup" ? "Pickup fee (KSh)" : "Delivery fee (KSh)"}
        <input
          name="delivery_fee_kes"
          inputMode="numeric"
          defaultValue={deliveryFee ?? ""}
          placeholder={delivery === "pickup" ? "Free" : "Not set"}
          className={`${FIELD} font-normal ${missingFee ? "border-adm-peach-ink" : ""}`}
        />
        <span className="text-[13px] font-normal text-adm-muted">
          Added to the {ksh(subtotal)} subtotal the customer sees. Enter 0 for free delivery.
        </span>
      </label>
      <div className="flex flex-col gap-1.5 rounded-[14px] bg-adm-surface px-3.5 py-3 text-sm">
        <span className="font-semibold">Payment</span>
        <span className="text-adm-body">{paymentLabel}</span>
        {canMarkPaid ? (
          <>
            <label className="mt-1 flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" name="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="size-4 accent-adm-primary" />
              Mark as paid
            </label>
            {paid && (
              <div className="mt-1 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 font-semibold">
                  Paid by
                  <select name="paid_via" value={via} onChange={(e) => setVia(e.target.value)} className={`${FIELD} font-normal`}>
                    {(["mpesa", "cash", "other"] as const).map((key) => (
                      <option key={key} value={key}>
                        {PAID_VIA[key]}
                      </option>
                    ))}
                  </select>
                </label>
                {via === "mpesa" && (
                  <label className="flex flex-col gap-1.5 font-semibold">
                    M-Pesa confirmation code
                    <input
                      name="payment_reference"
                      defaultValue={paymentReference ?? ""}
                      required
                      autoComplete="off"
                      maxLength={12}
                      placeholder="e.g. SKL4X9Q2AB"
                      className={`${FIELD} font-mono font-normal uppercase placeholder:normal-case`}
                    />
                    <span className="text-[13px] font-normal text-adm-muted">From the customer&apos;s M-Pesa message or your till statement. Each code can only be used on one order.</span>
                  </label>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="text-[13px] text-adm-muted">Paid through Pesapal. This updates on its own when Pesapal confirms a payment.</span>
        )}
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
