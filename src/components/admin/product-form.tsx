"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { saveProduct, type FormState } from "@/app/admin/actions";
import { FIELD, FormMessage, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

export type ProductFormValues = {
  id?: string;
  name?: string;
  short_name?: string | null;
  brand?: string | null;
  category_id?: string;
  price_kes?: number | null;
  warranty?: string | null;
  badge?: string | null;
  description?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  show_in_hero?: boolean;
  show_in_banner?: boolean;
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 flex-none accent-brand" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}

export function ProductForm({
  values = {},
  categories,
}: {
  values?: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const onSubmit = useKeepValues(action);
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !values.id;

  // Next keeps recent pages alive in the background. Reset whenever the Add product
  // page is shown again, so it never opens with the previous product's details.
  useEffect(() => {
    if (isNew) formRef.current?.reset();
  }, [isNew]);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-6 border border-line bg-white p-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Product name">
            <input name="name" required maxLength={160} defaultValue={values.name} className={FIELD} />
          </Field>
        </div>
        <Field label="Category">
          <select name="category_id" required defaultValue={values.category_id ?? ""} className={FIELD}>
            <option value="" disabled>Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Price (KSh)" hint="Leave blank to show “Ask for price”. Customers can't add it to the cart.">
          <input name="price_kes" inputMode="numeric" defaultValue={values.price_kes ?? ""} className={FIELD} />
        </Field>
        <Field label="Brand">
          <input name="brand" maxLength={80} defaultValue={values.brand ?? ""} className={FIELD} />
        </Field>
        <Field label="Warranty" hint="For example: 24-month warranty">
          <input name="warranty" maxLength={80} defaultValue={values.warranty ?? ""} className={FIELD} />
        </Field>
        <Field label="Badge" hint="A short label on the photo, like New">
          <input name="badge" maxLength={20} defaultValue={values.badge ?? ""} className={FIELD} />
        </Field>
        <Field label="Short name" hint="Used in the Home page slider and banners. For example: Galaxy S26 Ultra">
          <input name="short_name" maxLength={40} defaultValue={values.short_name ?? ""} className={FIELD} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <textarea name="description" rows={5} maxLength={5000} defaultValue={values.description ?? ""} className={`${FIELD} !h-auto py-2.5`} />
          </Field>
        </div>
      </div>

      <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-2">
        <fieldset className="flex flex-col gap-3.5">
          <legend className="mb-3 text-sm font-medium text-muted uppercase">Availability</legend>
          <Toggle name="in_stock" label="In stock" hint="If off, customers see “Sold out”, and it leaves the Home page." defaultChecked={values.in_stock ?? true} />
          <Toggle name="is_active" label="Visible in the shop" hint="If off, the product is hidden from customers completely." defaultChecked={values.is_active ?? true} />
        </fieldset>
        <fieldset className="flex flex-col gap-3.5">
          <legend className="mb-3 text-sm font-medium text-muted uppercase">Home page</legend>
          <Toggle name="is_featured" label="Featured" hint="Shows in Top picks and Featured products." defaultChecked={values.is_featured ?? false} />
          <Toggle name="show_in_hero" label="Show in the slider" hint="Needs a product photo without the box." defaultChecked={values.show_in_hero ?? false} />
          <Toggle name="show_in_banner" label="Show in the promo banners" hint="Needs a product photo without the box." defaultChecked={values.show_in_banner ?? false} />
        </fieldset>
      </div>

      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? "Saving…" : values.id ? "Save changes" : "Add product"}
        </button>
        <Link href="/admin" className={SECONDARY_BUTTON}>Back to products</Link>
      </div>
    </form>
  );
}
