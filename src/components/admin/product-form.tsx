"use client";

import {
  ArrowLeftIcon,
  Bars3BottomLeftIcon,
  BanknotesIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  PhotoIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { addPhoto, saveProduct, type FormState } from "@/app/admin/actions";
import { AddPhotosTile, PHOTO_HINT, PhotoTile, TileButton } from "@/components/admin/photo-manager";
import { buttonClass, FIELD, FormMessage } from "@/components/admin/ui";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTOS, uploadProductImage } from "@/lib/storage";
import { BADGES, MAX_BANNERS, MAX_SLIDER, SHORT_NAME_MAX } from "@/lib/home-rules";
import { createClient } from "@/lib/supabase/client";

export type ProductFormValues = {
  id?: string;
  name?: string;
  short_name?: string | null;
  brand?: string | null;
  category_id?: string;
  price_kes?: number | null;
  was_price_kes?: number | null;
  warranty?: string | null;
  badge?: string | null;
  description?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  show_in_hero?: boolean;
  show_in_banner?: boolean;
};

type Picked = { file: File; url: string };

const INPUT = `${FIELD} h-11 font-normal placeholder:text-adm-faint`;

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
      <span>
        {label}
        {required && <span className="text-[#b42318]"> *</span>}
      </span>
      {children}
      {hint && <span className="text-[13px] font-normal text-adm-muted">{hint}</span>}
    </label>
  );
}

/** One numbered row: what the step is about on the left, its fields on the right. */
function Step({
  n,
  icon: Icon,
  title,
  hint,
  children,
}: {
  n: number;
  icon: typeof TagIcon;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const id = `pf-step-${n}`;
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-adm-line-soft py-6 first:border-t-0 md:grid-cols-[230px_1fr] md:gap-8"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-adm-tint text-adm-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[1px] text-adm-muted uppercase">Step {n}</p>
          <h2 id={id} className="text-lg leading-snug font-semibold">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-adm-muted">{hint}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** A checkbox drawn as a switch, with its label beside it. It still posts with the form. */
function Switch({
  name,
  label,
  hint,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  defaultChecked: boolean;
  onChange?: (on: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={onChange && ((e) => onChange(e.target.checked))}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-px inline-flex h-[26px] w-[46px] shrink-0 rounded-full bg-adm-line-strong p-[3px] transition-colors peer-checked:bg-adm-primary peer-focus-visible:ring-2 peer-focus-visible:ring-adm-primary/40 peer-checked:[&>span]:translate-x-5"
      >
        <span className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(11,27,51,0.25)] transition-transform" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-[13px] text-adm-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function ProductForm({
  values = {},
  categories,
  photoCount = 0,
}: {
  values?: ProductFormValues;
  categories: { id: string; name: string }[];
  /** How many photos the product already has (edit page only). */
  photoCount?: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({});
  const [photos, setPhotos] = useState<Picked[]>([]);
  const isNew = !values.id;
  // Tracked so the Home page step can say what's needed as switches change.
  const [inHero, setInHero] = useState(values.show_in_hero ?? false);
  const [inBanner, setInBanner] = useState(values.show_in_banner ?? false);
  const [shortName, setShortName] = useState(values.short_name ?? "");
  const promoted = inHero || inBanner;
  const hasPhoto = (isNew ? photos.length : photoCount) > 0;
  // An older badge outside the list stays selectable until it's changed.
  const badges: string[] = values.badge && !(BADGES as readonly string[]).includes(values.badge) ? [...BADGES, values.badge] : [...BADGES];

  // Next keeps recent pages alive in the background. Reset whenever the Add product
  // page is shown again, so it never opens with the previous product's details.
  // Picked photos and messages are cleared when the page is hidden, which also frees the previews.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    if (isNew) formRef.current?.reset();
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setState({});
      // A new product starts blank. The edit page loads fresh values when it opens again.
      if (isNew) {
        setInHero(false);
        setInBanner(false);
        setShortName("");
      }
    };
  }, [isNew]);

  function pick(files: File[]) {
    const accepted = files.filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)).slice(0, MAX_PHOTOS - photos.length);
    setState(
      accepted.length < files.length
        ? {
            error: `Some photos were skipped: only JPG, PNG, WebP or AVIF, up to ${MAX_PHOTOS} in all.`,
          }
        : {},
    );
    setPhotos((current) => [...current, ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, j) => j !== i));
  }

  const makeMain = (i: number) => setPhotos([photos[i], ...photos.filter((_, j) => j !== i)]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const form = new FormData(event.currentTarget);
    // Publish puts it in the shop; a draft is saved hidden, ready to publish later.
    if (isNew) {
      if (submitter?.value === "draft") form.delete("is_active");
      else form.set("is_active", "on");
    }
    const intent = submitter?.value ?? "save";

    startTransition(async () => {
      setState({});
      setBusy(intent);
      try {
        const result = await saveProduct(form);
        if (result.error || !isNew) {
          setState(result);
          return;
        }
        if (!result.id || !result.slug)
          return setState({
            error: "Couldn't add the product. Please try again.",
          });

        // The product exists now, so its photos have a folder to go in.
        // Uploaded in order, so the first stays the main photo.
        const chosen = photos;
        let failed = false;
        for (const [i, { file }] of chosen.entries()) {
          setBusy(`photo-${i + 1}-of-${chosen.length}`);
          try {
            const image = await uploadProductImage(createClient(), file, result.slug);
            const saved = await addPhoto(result.id, image);
            if (saved.error) failed = true;
          } catch {
            failed = true;
          }
        }
        const note = failed ? "photo-failed" : chosen.length ? "1" : "no-photos";
        router.push(`/admin/products/${result.id}?new=${note}${intent === "draft" ? "&draft=1" : ""}`);
      } finally {
        setBusy(null);
      }
    });
  }

  useEffect(() => {
    if (state.error) document.getElementById("pf-message")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  const label = (intent: string, idle: string, working: string) => {
    if (busy === intent) return working;
    const uploading = busy?.match(/^photo-(\d+)-of-(\d+)$/);
    if (uploading) return `Uploading photo ${uploading[1]} of ${uploading[2]}…`;
    return idle;
  };

  return (
    <form ref={formRef} onSubmit={submit} className="flex flex-col gap-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {isNew && (
        <Link href="/admin/products" className="inline-flex w-fit items-center gap-2 text-sm text-adm-body hover:text-adm-primary">
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back to products
        </Link>
      )}

      <div className="rounded-[20px] border border-adm-line bg-white">
        {isNew && (
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-adm-line-soft px-5 py-6 sm:px-7">
            <div className="min-w-0">
              <h1 className="text-[28px] leading-tight font-semibold">Add a product</h1>
              <p className="mt-1.5 text-sm text-adm-body">Name it, set its price and photos, then describe it for customers.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/admin/products" className={buttonClass.outline}>
                Cancel
              </Link>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={pending}
                className={`${buttonClass.outline} !border-adm-primary !text-adm-primary hover:!bg-adm-tint`}
              >
                <DocumentArrowDownIcon className="size-4" aria-hidden />
                {label("draft", "Save as draft", "Saving…")}
              </button>
              <button type="submit" name="intent" value="publish" disabled={pending} className={buttonClass.primary}>
                <CheckIcon className="size-4 stroke-[2.4]" aria-hidden />
                {label("publish", "Publish", "Publishing…")}
              </button>
            </div>
            <div id="pf-message" className="w-full empty:hidden">
              <FormMessage state={state} />
            </div>
          </div>
        )}

        <div className="px-5 sm:px-7">
          <Step n={1} icon={TagIcon} title="Identity" hint="What customers see in the shop.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Product name" required>
                <input
                  name="name"
                  required
                  maxLength={160}
                  defaultValue={values.name}
                  placeholder="e.g. Samsung Galaxy A17"
                  className={INPUT}
                />
              </Field>
              <Field label="Category" required>
                <select name="category_id" required defaultValue={values.category_id ?? ""} className={INPUT}>
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Brand">
                <input name="brand" maxLength={80} defaultValue={values.brand ?? ""} placeholder="e.g. Samsung" className={INPUT} />
              </Field>
            </div>
          </Step>

          {isNew && (
            <Step n={2} icon={PhotoIcon} title="Photos" hint="The main one shows on cards; all of them on the product page.">
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, i) => (
                  <PhotoTile
                    key={photo.url}
                    src={photo.url}
                    main={i === 0}
                    alt={i === 0 ? "Main photo preview" : `Photo ${i + 1} preview`}
                    actions={
                      <>
                        {i > 0 && (
                          <TileButton label="Make this the main photo" onClick={() => makeMain(i)} disabled={pending}>
                            <StarIcon className="size-4" />
                          </TileButton>
                        )}
                        <TileButton label="Remove this photo" danger onClick={() => removePhoto(i)} disabled={pending}>
                          <TrashIcon className="size-4" />
                        </TileButton>
                      </>
                    }
                  />
                ))}
                {photos.length < MAX_PHOTOS && (
                  <AddPhotosTile onPick={pick} disabled={pending} label={photos.length ? "Add more" : "Choose photos"} />
                )}
              </div>
              <p className="mt-3 max-w-3xl text-[13px] text-adm-muted">{PHOTO_HINT} You can pick several at once.</p>
            </Step>
          )}

          <Step n={isNew ? 3 : 2} icon={BanknotesIcon} title="Price & stock" hint="What it costs and if it can be ordered.">
            <div className="grid items-start gap-4 md:grid-cols-2">
              <Field label="Price (KES)" hint="Leave blank to show “Ask for price”.">
                <input
                  name="price_kes"
                  inputMode="numeric"
                  defaultValue={values.price_kes ?? ""}
                  placeholder="e.g. 22500"
                  className={INPUT}
                />
              </Field>
              <Field label="Was price (KES)" hint="For offers: the old price, shown crossed out with the saving. Leave blank when not on offer.">
                <input
                  name="was_price_kes"
                  inputMode="numeric"
                  defaultValue={values.was_price_kes ?? ""}
                  placeholder="e.g. 25000"
                  className={INPUT}
                />
              </Field>
              <Field label="Warranty">
                <input
                  name="warranty"
                  maxLength={80}
                  defaultValue={values.warranty ?? ""}
                  placeholder="e.g. 24-month warranty"
                  className={INPUT}
                />
              </Field>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Switch
                name="in_stock"
                label="In stock"
                hint="If off, customers see “Sold out” and can't order it."
                defaultChecked={values.in_stock ?? true}
              />
              {!isNew && (
                <Switch
                  name="is_active"
                  label="Visible in the shop"
                  hint="If off, it's hidden from customers completely."
                  defaultChecked={values.is_active ?? true}
                />
              )}
            </div>
          </Step>

          <Step n={isNew ? 4 : 3} icon={Bars3BottomLeftIcon} title="Description" hint="The text on its page.">
            <Field label="Description">
              <textarea
                name="description"
                rows={6}
                maxLength={5000}
                defaultValue={values.description ?? ""}
                className={`${FIELD} font-normal`}
              />
            </Field>
          </Step>

          <Step n={isNew ? 5 : 4} icon={HomeIcon} title="Home page" hint="Optional. Where it's promoted.">
            <div className="grid gap-4 md:grid-cols-3">
              <Switch
                name="is_featured"
                label="Featured"
                hint="In Top picks and Featured products."
                defaultChecked={values.is_featured ?? false}
              />
              <Switch
                name="show_in_hero"
                label="Show in the slider"
                hint={`Up to ${MAX_SLIDER} products. Uses the main photo.`}
                defaultChecked={values.show_in_hero ?? false}
                onChange={setInHero}
              />
              <Switch
                name="show_in_banner"
                label="Show in the promo banners"
                hint={`Up to ${MAX_BANNERS} products. Uses the main photo.`}
                defaultChecked={values.show_in_banner ?? false}
                onChange={setInBanner}
              />
            </div>
            {promoted && (
              <p
                className={`mt-4 rounded-[12px] px-3.5 py-2.5 text-[13px] ${hasPhoto ? "bg-adm-tint text-adm-primary-dark" : "bg-[#fef3e2] text-[#93400d]"}`}
              >
                {hasPhoto
                  ? "The main photo sits on a coloured background here, so a cut-out on white looks best."
                  : "Add a photo first: products without one don't appear in the slider or banners. A cut-out on white looks best."}
              </p>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Badge" hint="A label on the card's photo.">
                <select name="badge" defaultValue={values.badge ?? ""} className={INPUT}>
                  <option value="">None</option>
                  {badges.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Short name"
                required={promoted}
                hint={`${promoted ? "Needed for the slider and banners" : "Used in the slider and banners"}, like Galaxy S26 Ultra. ${shortName.length} of ${SHORT_NAME_MAX}.`}
              >
                <input
                  name="short_name"
                  required={promoted}
                  maxLength={SHORT_NAME_MAX}
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. Galaxy S26 Ultra"
                  className={INPUT}
                />
              </Field>
            </div>
          </Step>
        </div>
      </div>

      {!isNew && (
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-[20px] border border-adm-line bg-white/95 px-[22px] py-3.5 backdrop-blur">
          <button type="submit" disabled={pending} className={buttonClass.primary}>
            <CheckIcon className="size-4 stroke-[2.4]" aria-hidden />
            {pending ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/products" className={buttonClass.outline}>
            Back to products
          </Link>
          <div id="pf-message" className="flex-1">
            <FormMessage state={state} />
          </div>
        </div>
      )}
    </form>
  );
}
