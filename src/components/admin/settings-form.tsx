"use client";

import { useActionState, type ReactNode } from "react";
import { saveShopSettings, type FormState } from "@/app/admin/actions";
import { buttonClass, FIELD, FormMessage } from "@/components/admin/ui";
import type { SettingsRow } from "@/lib/settings";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="text-[13px] font-normal text-adm-muted">{hint}</span>}
    </label>
  );
}

function Money({ name, value, placeholder }: { name: string; value: number | null; placeholder: string }) {
  return (
    <span className="flex items-center gap-2 rounded-[10px] border border-adm-line-strong bg-white px-3 focus-within:border-adm-primary focus-within:ring-2 focus-within:ring-adm-primary/20">
      <span className="text-xs font-normal text-adm-muted">KSh</span>
      <input name={name} inputMode="numeric" defaultValue={value ?? ""} placeholder={placeholder} className="min-w-0 flex-1 py-2.5 text-sm font-normal outline-0" />
    </span>
  );
}

const CARD = "flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-[22px] py-5";

export function SettingsForm({ values }: { values: SettingsRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveShopSettings, {});
  return (
    <form action={action} className="flex max-w-4xl flex-col gap-[18px]">
      <section aria-labelledby="s-shop" className={CARD}>
        <div>
          <h2 id="s-shop" className="text-lg font-semibold">
            Shop details
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">Shown in the footer, on the Home page and on order pages. Blank details are left out.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Shop address" hint="The street and building. “Nairobi” is added for you.">
            <input name="address" maxLength={160} defaultValue={values.address ?? ""} placeholder="e.g. Shop 12, Luthuli Avenue" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Opening hours">
            <input name="hours" maxLength={120} defaultValue={values.hours ?? ""} placeholder="e.g. Mon–Sat, 8am – 7pm" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Email address" hint="Where customers can write to you.">
            <input name="email" type="email" maxLength={200} defaultValue={values.email ?? ""} placeholder="e.g. hello@sky254.co.ke" className={`${FIELD} font-normal`} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="s-social" className={CARD}>
        <div>
          <h2 id="s-social" className="text-lg font-semibold">
            Social media
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">Paste the link to each page. Its icon shows in the footer once it has a link.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Facebook">
            <input name="facebook_url" defaultValue={values.facebook_url ?? ""} placeholder="facebook.com/sky254" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Instagram">
            <input name="instagram_url" defaultValue={values.instagram_url ?? ""} placeholder="instagram.com/sky254" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="TikTok">
            <input name="tiktok_url" defaultValue={values.tiktok_url ?? ""} placeholder="tiktok.com/@sky254" className={`${FIELD} font-normal`} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="s-delivery" className={CARD}>
        <div>
          <h2 id="s-delivery" className="text-lg font-semibold">
            Delivery fees
          </h2>
          <p className="mt-0.5 text-sm text-adm-muted">
            Added to orders at checkout. Leave a fee blank to confirm it by phone instead. Pickup from the shop is always free, and you can still
            change the fee on any order.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Delivery within Nairobi">
            <Money name="nairobi_fee_kes" value={values.nairobi_fee_kes} placeholder="e.g. 300" />
          </Field>
          <Field label="Countrywide courier">
            <Money name="countrywide_fee_kes" value={values.countrywide_fee_kes} placeholder="e.g. 600" />
          </Field>
          <Field label="Free delivery from" hint="Orders of this amount or more deliver free. Blank for none.">
            <Money name="free_delivery_over_kes" value={values.free_delivery_over_kes} placeholder="e.g. 20000" />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass.primary}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
