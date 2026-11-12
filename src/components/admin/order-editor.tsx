"use client";

import { useActionState } from "react";
import { updateOrder, type FormState } from "@/app/admin/actions";
import { buttonClass, FIELD, FormMessage, ksh } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";
import { ORDER_STATUS, STATUS_ORDER, type DeliveryMethod, type OrderStatus } from "@/lib/admin/orders";

/** Status, delivery fee and cash received, saved together. */
export function OrderEditor({
  id,
  status,
  delivery,
  deliveryFee,
  subtotal,
  isCash,
  canMarkPaid,
  isPaid,
  paymentLabel,
}: {
  id: string;
  status: OrderStatus;
  delivery: DeliveryMethod;
  deliveryFee: number | null;
  subtotal: number;
  isCash: boolean;
  /** Cash, or M-Pesa paid straight to the shop (no Safaricom payment on record). */
  canMarkPaid: boolean;
  isPaid: boolean;
  paymentLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrder, {});
  const onSubmit = useKeepValues(action);
  const missingFee = delivery !== "pickup" && deliveryFee == null;

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
          <label className="mt-1 flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" name="paid" defaultChecked={isPaid} className="size-4 accent-adm-primary" />
            {isCash ? "Cash received" : "M-Pesa received"}
          </label>
        ) : (
          <span className="text-[13px] text-adm-muted">M-Pesa payments are confirmed by Safaricom automatically.</span>
        )}
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={buttonClass.primary}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
