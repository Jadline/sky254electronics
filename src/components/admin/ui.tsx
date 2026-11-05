import type { FormState } from "@/app/admin/actions";

export const FIELD =
  "h-11 w-full border border-[#cfd5e1] bg-white px-3 text-sm font-normal text-text outline-none transition-colors focus:border-brand";
export const PRIMARY_BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60";
export const SECONDARY_BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center border border-[#cfd5e1] bg-white px-5 text-sm font-medium transition-colors hover:border-text";
export const DANGER_BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center border border-[#d92d20] bg-white px-5 text-sm font-medium text-[#b42318] transition-colors hover:bg-[#fef3f2]";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-[#b42318]">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm text-[#15803d]">{state.message}</p>;
  return null;
}
