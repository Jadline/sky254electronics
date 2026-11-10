"use client";

import { PhotoIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { addPhoto, deletePhoto, makeMainPhoto } from "@/app/admin/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTOS, uploadProductImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export type AdminPhoto = { id: string; url: string; bytes: number };

export const PHOTO_HINT = `The first photo is the main one. Up to ${MAX_PHOTOS}.`;

/** A square photo tile with a "Main" label on the first, and buttons that appear on hover. */
export function PhotoTile({ src, main, alt, actions }: { src: string; main: boolean; alt: string; actions: ReactNode }) {
  return (
    <div className="group relative size-[120px] overflow-hidden rounded-xl border border-adm-line bg-white">
      {/* Previews may be local blob: URLs, which next/image can't optimise. */}
      {src.startsWith("blob:") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-contain p-1.5" />
      ) : (
        <Image src={src} alt={alt} fill sizes="120px" className="object-contain p-1.5" />
      )}
      {main && (
        <span className="absolute top-1.5 left-1.5 rounded-full bg-adm-primary px-2 py-0.5 text-[11px] font-semibold text-white">Main</span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/45 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {actions}
      </div>
    </div>
  );
}

export function TileButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow hover:bg-white disabled:cursor-wait disabled:opacity-60 ${danger ? "text-[#b42318]" : "text-adm-ink"}`}
    >
      {children}
    </button>
  );
}

/** The dashed tile that picks one or more photos. */
export function AddPhotosTile({
  onPick,
  disabled,
  label = "Add photos",
}: {
  onPick: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <label
      className={`flex size-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-adm-line-strong bg-white px-2 text-center text-[13px] font-semibold text-adm-primary transition-colors hover:border-adm-primary hover:bg-adm-tint focus-within:ring-2 focus-within:ring-adm-primary/30 ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <PhotoIcon className="size-6" aria-hidden />
      {label}
      <input
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) onPick(files);
        }}
      />
    </label>
  );
}

export function PhotoManager({ productId, slug, photos }: { productId: string; slug: string; photos: AdminPhoto[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const room = MAX_PHOTOS - photos.length;

  async function run(label: string, work: () => Promise<string | null>) {
    setBusy(label);
    setError(null);
    setSaved(null);
    try {
      setSaved(await work());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
      startTransition(() => router.refresh());
    }
  }

  function upload(files: File[]) {
    const accepted = files.filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)).slice(0, room);
    const skipped = files.length - accepted.length;
    if (!accepted.length) {
      setError(room ? "Please choose JPG, PNG, WebP or AVIF images." : `A product can have up to ${MAX_PHOTOS} photos.`);
      return;
    }
    run("upload", async () => {
      let before = 0;
      let after = 0;
      for (const [i, file] of accepted.entries()) {
        setBusy(`Uploading ${i + 1} of ${accepted.length}…`);
        const image = await uploadProductImage(createClient(), file, slug);
        const result = await addPhoto(productId, image);
        if (result.error) throw new Error(result.error);
        before += file.size;
        after += image.bytes;
      }
      const kb = (n: number) => `${Math.round(n / 1024).toLocaleString()} KB`;
      const note = skipped ? ` ${skipped} skipped (wrong type, or over the limit of ${MAX_PHOTOS}).` : "";
      return `${accepted.length === 1 ? "Photo" : `${accepted.length} photos`} added, compressed from ${kb(before)} to ${kb(after)}.${note}`;
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-[22px] py-5">
      <div>
        <h2 className="text-lg font-semibold">
          Photos{" "}
          <span className="text-sm font-normal text-adm-muted">
            ({photos.length} of {MAX_PHOTOS})
          </span>
        </h2>
        <p className="mt-0.5 max-w-3xl text-sm text-adm-muted">{PHOTO_HINT}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, i) => (
          <PhotoTile
            key={photo.id}
            src={photo.url}
            main={i === 0}
            alt={i === 0 ? "Main photo" : `Photo ${i + 1}`}
            actions={
              <>
                {i > 0 && (
                  <TileButton
                    label="Make this the main photo"
                    disabled={busy != null}
                    onClick={() =>
                      run("main", async () => {
                        const result = await makeMainPhoto(photo.id);
                        if (result.error) throw new Error(result.error);
                        return "Main photo changed.";
                      })
                    }
                  >
                    <StarIcon className="size-4" />
                  </TileButton>
                )}
                <TileButton
                  label="Remove this photo"
                  danger
                  disabled={busy != null}
                  onClick={() =>
                    run("remove", async () => {
                      const result = await deletePhoto(photo.id);
                      if (result.error) throw new Error(result.error);
                      return "Photo removed.";
                    })
                  }
                >
                  <TrashIcon className="size-4" />
                </TileButton>
              </>
            }
          />
        ))}
        {room > 0 && <AddPhotosTile onPick={upload} disabled={busy != null} label={busy?.startsWith("Uploading") ? busy : "Add photos"} />}
      </div>
      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-sm text-[#116632]">
          {saved}
        </p>
      )}
    </section>
  );
}
