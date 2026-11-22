import "server-only";
import type { MpesaPayTo, PaymentInfo } from "@/lib/payment-options";
import { pesapalReady } from "@/lib/pesapal";
import type { ShopSettings } from "@/lib/settings";

const digits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "") || null;

/**
 * Where customers send M-Pesa: the till, paybill and phone number set under Shop settings. Anything
 * left empty there falls back to SHOP_MPESA_TILL / SHOP_MPESA_PAYBILL / SHOP_MPESA_PHONE.
 * Null until at least one is set.
 */
export function mpesaPayTo(settings: Pick<ShopSettings, "mpesaTill" | "mpesaPaybill" | "mpesaPaybillAccount" | "mpesaPhone"> | null): MpesaPayTo {
  const till = digits(settings?.mpesaTill) ?? digits(process.env.SHOP_MPESA_TILL);
  const paybill = digits(settings?.mpesaPaybill) ?? digits(process.env.SHOP_MPESA_PAYBILL);
  const account = settings?.mpesaPaybillAccount?.trim() || process.env.SHOP_MPESA_PAYBILL_ACCOUNT?.trim() || null;
  const phone = settings?.mpesaPhone?.trim() || process.env.SHOP_MPESA_PHONE?.trim() || null;
  return till || paybill || phone ? { till, paybill, account, phone } : null;
}

/** "We'll call you within N minutes", from SHOP_CONFIRM_MINUTES (default 15). */
export function confirmMinutes() {
  const n = Number(process.env.SHOP_CONFIRM_MINUTES);
  return Number.isInteger(n) && n > 0 && n <= 240 ? n : 15;
}

/** Everything the payment wording needs, for pages to hand to their components. */
export function paymentInfo(settings: Parameters<typeof mpesaPayTo>[0]): PaymentInfo {
  return { payTo: mpesaPayTo(settings), confirmMinutes: confirmMinutes(), pesapalOn: pesapalReady() };
}
