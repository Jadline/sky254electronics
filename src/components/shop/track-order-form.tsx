"use client";

import { useActionState } from "react";
import { trackOrder } from "@/app/(site)/actions";

const FIELD = "h-11 w-full border border-line bg-white px-3.5 text-sm font-normal outline-none transition-colors focus:border-brand";

export function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrder, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Order number
        <input name="order" required autoComplete="off" placeholder="SKY-AB12CD" maxLength={12} className={`${FIELD} uppercase placeholder:normal-case`} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Phone number
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0712 345 678" maxLength={20} className={FIELD} />
      </label>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-[#b42318]">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-lift h-11 cursor-pointer rounded-full bg-brand text-[13px] font-medium text-white uppercase disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Looking…" : "Track order"}
      </button>
    </form>
  );
}
