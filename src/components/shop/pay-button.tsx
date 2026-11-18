"use client";

import { useActionState } from "react";
import { payOrder, type PayState } from "@/app/(site)/order/[token]/pay-actions";

/** Opens Pesapal's payment page for the order. */
export function PayButton({ token, label }: { token: string; label: string }) {
  const [state, action, pending] = useActionState<PayState, FormData>(payOrder, {});
  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="btn-lift h-11 cursor-pointer self-start rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening Pesapal…" : label}
      </button>
      {state.error && (
        <p role="alert" className="text-[13px] text-[#b42318]">
          {state.error}
        </p>
      )}
    </form>
  );
}
