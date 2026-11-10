"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, ExclamationTriangleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ComponentType, FormEvent, ReactNode, SVGProps } from "react";
import { buttonClass } from "./ui";

const BACKDROP = "fixed inset-0 bg-adm-ink/30 backdrop-blur-[6px]";
const PANEL = "w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(11,27,51,0.22)]";
const FOOTER = "flex justify-end gap-2.5 border-t border-adm-line-soft bg-adm-surface px-6 py-4";

/**
 * The admin's "are you sure?" dialog, in place of the browser's confirm(). Cancel is focused
 * first, so Enter never confirms by accident; it stays open until the action has finished.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={() => !pending && onClose()} className="relative z-50">
      <div className={BACKDROP} aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className={`${PANEL} max-w-[440px]`}>
          <div className="flex gap-3.5 px-6 pt-6 pb-5">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3f2] text-[#b42318]">
              <ExclamationTriangleIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold text-adm-ink">{title}</DialogTitle>
              {children && <div className="mt-1 text-sm text-adm-body">{children}</div>}
            </div>
          </div>
          <div className={FOOTER}>
            <button type="button" autoFocus disabled={pending} onClick={onClose} className={buttonClass.outline}>
              Cancel
            </button>
            <button type="button" disabled={pending} onClick={onConfirm} className={buttonClass.danger}>
              {pending ? `${confirmLabel}…` : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

/**
 * The admin's add/edit dialog: an icon and title, the fields, then Cancel and the
 * save button side by side on the right (+ for adding, ✓ for saving changes).
 */
export function FormDialog({
  title,
  icon: Icon,
  adding,
  submitLabel,
  pending,
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adding: boolean;
  submitLabel: string;
  pending: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open onClose={() => !pending && onClose()} className="relative z-50">
      <div className={BACKDROP} aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          as="form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
          className={`${PANEL} max-w-[480px]`}
        >
          <div className="flex items-center gap-3 px-6 pt-5">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-adm-tint text-adm-primary">
              <Icon className="size-5" />
            </span>
            <DialogTitle className="flex-1 text-lg font-semibold text-adm-ink">{title}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 flex size-9 cursor-pointer items-center justify-center rounded-full text-adm-muted hover:bg-adm-surface hover:text-adm-ink"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4 px-6 pt-5 pb-6">{children}</div>
          <div className={FOOTER}>
            <button type="button" onClick={onClose} className={buttonClass.outline}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass.primary}>
              {adding ? <PlusIcon className="size-4 stroke-[2.4]" aria-hidden /> : <CheckIcon className="size-4 stroke-[2.4]" aria-hidden />}
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
