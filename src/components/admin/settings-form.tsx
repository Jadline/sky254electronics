"use client";

import { AtSymbolIcon, BanknotesIcon, BuildingStorefrontIcon, TruckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useActionState, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { saveShopSettings, type FormState } from "@/app/admin/actions";
import { buttonClass, FIELD, FormMessage } from "@/components/admin/ui";
import type { SettingsRow } from "@/lib/settings";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** One block of settings: what it is on the left, its fields on the right. */
function Section({
  id,
  eyebrow,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  icon: Icon;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 overflow-hidden rounded-[20px] border border-adm-line bg-white">
      <div className="grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[272px_minmax(0,1fr)]">
        <div className="flex items-start gap-3 border-b border-adm-line bg-adm-surface/60 px-5 py-4 md:border-r md:border-b-0 md:py-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-adm-tint text-adm-primary">
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-adm-primary uppercase">{eyebrow}</p>
            <h2 id={`${id}-h`} className="mt-0.5 text-base font-semibold text-adm-ink">
              {title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-adm-muted">{description}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 px-5 py-5 md:px-6 md:py-6">{children}</div>
      </div>
    </section>
  );
}

function Field({ label, hint, children, wide = false }: { label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {hint && <span className="text-[13px] font-normal text-adm-muted">{hint}</span>}
    </label>
  );
}

type Values = {
  mpesa_till: string;
  mpesa_paybill: string;
  mpesa_paybill_account: string;
  mpesa_phone: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  address: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
};

const toValues = (row: SettingsRow): Values => ({
  mpesa_till: row.mpesa_till ?? "",
  mpesa_paybill: row.mpesa_paybill ?? "",
  mpesa_paybill_account: row.mpesa_paybill_account ?? "",
  mpesa_phone: row.mpesa_phone ?? "",
  phone: row.phone ?? "",
  whatsapp: row.whatsapp ?? "",
  email: row.email ?? "",
  hours: row.hours ?? "",
  address: row.address ?? "",
  facebook_url: row.facebook_url ?? "",
  instagram_url: row.instagram_url ?? "",
  tiktok_url: row.tiktok_url ?? "",
});

const SOCIAL = [
  ["facebook_url", "Facebook", "facebook.com/sky254"],
  ["instagram_url", "Instagram", "instagram.com/sky254"],
  ["tiktok_url", "TikTok", "tiktok.com/@sky254"],
] as const;

export function SettingsForm({ values: row }: { values: SettingsRow }) {
  const [saved, setSaved] = useState(() => toValues(row));
  const [form, setForm] = useState(saved);
  const submitted = useRef(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Once a save succeeds, what was sent becomes the saved version.
  const [state, action, pending] = useActionState<FormState, FormData>(async (previous, data) => {
    const sent = submitted.current;
    const result = await saveShopSettings(previous, data);
    if (result.message) setSaved(sent);
    return result;
  }, {});

  const text = (key: keyof Values) => ({
    name: key,
    value: form[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    className: `${FIELD} font-normal`,
  });

  const footer = (
    <div className="flex flex-wrap items-center gap-3">
      <p role="status" className="min-w-0 flex-1 text-[13px]">
        {state.error || state.message ? (
          <FormMessage state={state} />
        ) : dirty ? (
          <span className="font-semibold text-[#b54708]">Unsaved changes</span>
        ) : (
          <span className="text-adm-muted">Everything is saved. The website shows changes straight away.</span>
        )}
      </p>
      <button type="button" onClick={() => setForm(saved)} disabled={!dirty || pending} className={buttonClass.smallOutline}>
        Discard changes
      </button>
      <button type="submit" disabled={!dirty || pending} className={buttonClass.small}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );

  return (
    <form action={action} onSubmit={() => (submitted.current = form)} className="flex flex-col gap-[18px]">
      <Section
        id="contact"
        eyebrow="Website"
        icon={BuildingStorefrontIcon}
        title="Contact details"
        description="Shown in the header, footer, About and Contact pages, and on the order emails."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number" hint="Shown to customers and in emails. Leave empty to keep the current number.">
            <input type="tel" maxLength={30} placeholder="e.g. 0116 236902" {...text("phone")} />
          </Field>
          <Field label="WhatsApp number" hint="Where the WhatsApp buttons send customers. Leave empty to use the phone number above.">
            <input type="tel" maxLength={30} placeholder="e.g. 0116 236902" {...text("whatsapp")} />
          </Field>
          <Field label="Email address" hint="Where the Contact page and emails tell customers to write.">
            <input type="email" maxLength={200} placeholder="e.g. hello@sky254.co.ke" {...text("email")} />
          </Field>
          <Field label="Opening hours">
            <input maxLength={120} placeholder="e.g. Mon–Sat, 8am – 7pm" {...text("hours")} />
          </Field>
          <Field
            label="Shop address"
            wide
            hint="Type it the way you would search for it in Google Maps. The About and Contact pages show it on a map; leave empty to show Nairobi."
          >
            <input maxLength={160} placeholder="e.g. Shop 12, Luthuli Avenue" {...text("address")} />
          </Field>
        </div>
      </Section>

      <Section
        id="payments"
        eyebrow="Checkout"
        icon={BanknotesIcon}
        title="M-Pesa payments"
        description="Where customers pay by M-Pesa. They see this right after placing an order. Fill in any or all of them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Buy Goods Till number" hint="Customers pay with Lipa na M-Pesa, Buy Goods.">
            <input inputMode="numeric" maxLength={8} placeholder="e.g. 5123456" {...text("mpesa_till")} />
          </Field>
          <Field label="Paybill business number">
            <input inputMode="numeric" maxLength={8} placeholder="e.g. 400200" {...text("mpesa_paybill")} />
          </Field>
          <Field label="Paybill account number" hint="What customers enter as the account with your paybill.">
            <input maxLength={40} placeholder="e.g. Sky254" {...text("mpesa_paybill_account")} />
          </Field>
          <Field label="Send Money phone number" hint="For customers who send money to a phone number.">
            <input type="tel" maxLength={30} placeholder="e.g. 0712 345 678" {...text("mpesa_phone")} />
          </Field>
        </div>
        <p className="rounded-xl bg-adm-surface px-3.5 py-2.5 text-[13px] text-adm-muted">
          Customers can then type the M-Pesa code you receive, and you mark the order paid. Card payment through Pesapal stays off until it is switched on.
        </p>
      </Section>

      <Section id="social" eyebrow="Website" icon={AtSymbolIcon} title="Social profiles" description="Leave a field empty to hide that icon in the footer.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL.map(([key, label, placeholder]) => (
            <Field key={key} label={label}>
              <input placeholder={placeholder} {...text(key)} />
            </Field>
          ))}
        </div>
      </Section>

      <Section id="delivery" eyebrow="Checkout" icon={TruckIcon} title="Delivery fees" description="Delivery areas, pickup points and free delivery.">
        <p className="text-sm text-adm-body">
          Fees, pickup points and the free-delivery amount are set under{" "}
          <Link href="/admin/delivery" className="font-semibold text-adm-primary hover:underline">
            Delivery
          </Link>
          . The wording of the delivery policy is under{" "}
          <Link href="/admin/legal/delivery" className="font-semibold text-adm-primary hover:underline">
            Legal pages
          </Link>
          .
        </p>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 rounded-[20px] border border-adm-line bg-white/95 px-5 py-3.5 shadow-[0_-8px_24px_rgba(11,27,51,0.06)] backdrop-blur">
        {footer}
      </div>
    </form>
  );
}
