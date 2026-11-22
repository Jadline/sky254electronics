"use client";

import { useActionState } from "react";
import { claimPayment, type ClaimState } from "@/app/(site)/order/[token]/claim-actions";

/** "Already paid? Enter the M-Pesa code." The shop checks it and marks the order paid. */
export function ClaimPaymentForm({ token, claimed }: { token: string; claimed: string | null }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimPayment, {});
  if (state.done || claimed) {
    return (
      <p role="status" className="bg-white p-3.5 text-body">
        Thank you. We have your M-Pesa code{claimed ? <> <strong className="font-medium text-text">{claimed}</strong></> : null}. We&apos;ll check it and mark your order paid shortly.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2 bg-white p-3.5">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Already paid? Enter the M-Pesa code from your message
        <input
          name="code"
          required
          maxLength={14}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="e.g. SKL4X9Q2AB"
          className="h-11 w-full border border-line bg-white px-3.5 text-sm font-normal uppercase outline-none focus:border-brand"
        />
      </label>
      {state.error && <p role="alert" className="text-[13px] text-[#b42318]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-lift h-10 cursor-pointer self-start rounded-full border-2 border-text px-6 text-[13px] font-medium uppercase disabled:opacity-60">
        {pending ? "Sending…" : "I've paid"}
      </button>
    </form>
  );
}
