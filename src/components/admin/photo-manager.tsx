"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePhoto, savePhoto } from "@/app/admin/actions";
import { ACCEPTED_IMAGE_TYPES, uploadProductImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export type AdminPhoto = { id: string; url: string; bytes: number };

const SLOTS = [
  { kind: "product", title: "Product photo", hint: "The product on its own, ideally on white." },
  { kind: "box", title: "Box photo", hint: "The product in its box, or in the shop." },
] as const;

function PhotoSlot({
  productId,
  slug,
  kind,
  title,
  hint,
  photo,
}: {
  productId: string;
  slug: string;
  kind: "product" | "box";
  title: string;
  hint: string;
  photo?: AdminPhoto;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const image = await uploadProductImage(createClient(), file, slug);
      const result = await savePhoto(productId, kind, image);
      if (result.error) throw new Error(result.error);
      setSaved(`Compressed from ${Math.round(file.size / 1024)} KB to ${Math.round(image.bytes / 1024)} KB.`);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-line p-4">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <div className="relative aspect-square w-full bg-tint">
        {photo ? (
          <Image src={photo.url} alt={title} fill sizes="400px" className={kind === "product" ? "object-contain" : "object-cover"} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">No photo yet</span>
        )}
      </div>
      {photo && <p className="text-xs text-muted">Stored size: {Math.round(photo.bytes / 1024)} KB</p>}
      <div className="flex flex-wrap items-center gap-3">
        <label className={`inline-flex h-10 cursor-pointer items-center bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Compressing and uploading…" : photo ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            disabled={busy}
            aria-label={`${title} file`}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) upload(file);
            }}
          />
        </label>
        {photo && (
          <form action={deletePhoto}>
            <input type="hidden" name="id" value={photo.id} />
            <button type="submit" className="h-10 cursor-pointer text-sm text-[#b42318]">Remove</button>
          </form>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-[#b42318]">{error}</p>}
      {saved && <p role="status" className="text-sm text-[#15803d]">{saved}</p>}
    </div>
  );
}

export function PhotoManager({
  productId,
  slug,
  photos,
}: {
  productId: string;
  slug: string;
  photos: { product?: AdminPhoto; box?: AdminPhoto };
}) {
  return (
    <section className="flex flex-col gap-4 border border-line bg-white p-6">
      <div>
        <h2 className="text-lg font-medium">Photos</h2>
        <p className="text-sm text-muted">Photos are compressed automatically before they&apos;re stored.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {SLOTS.map((slot) => (
          <PhotoSlot key={slot.kind} productId={productId} slug={slug} {...slot} photo={photos[slot.kind]} />
        ))}
      </div>
    </section>
  );
}
