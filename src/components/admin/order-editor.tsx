"use client";

import { useActionState } from "react";
import { updateOrder, type FormState } from "@/app/admin/actions";
import { FIELD, FormMessage, PRIMARY_BUTTON } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-labels";

export function OrderEditor({
  id,
  status,
  deliveryFee,
  paymentMethodLabel,
  paymentStatusLabel,
  isCash,
  isPaid,
}: {
  id: string;
  status: OrderStatus;
  deliveryFee: number | null;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  isCash: boolean;
  isPaid: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrder, {});
  const onSubmit = useKeepValues(action);

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-4 border border-line bg-white p-6">
      <h2 className="text-lg font-medium">Manage order</h2>
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Status
        <select name="status" defaultValue={status} className={FIELD}>
          {(Object.entries(ORDER_STATUSES) as [OrderStatus, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Delivery fee (KSh)
        <input name="delivery_fee_kes" inputMode="numeric" defaultValue={deliveryFee ?? ""} placeholder="Not set" className={FIELD} />
        <span className="text-xs font-normal text-muted">Added to the total the customer sees. Enter 0 for free delivery.</span>
      </label>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Payment</span>
        <span className="text-body">{paymentMethodLabel}</span>
        {isCash ? (
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" name="paid" defaultChecked={isPaid} className="size-4 accent-brand" />
            Payment received
          </label>
        ) : (
          <span className="text-body">{paymentStatusLabel}</span>
        )}
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
