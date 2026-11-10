import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import type { FormState } from "@/app/admin/actions";

/** Building blocks shared by the admin pages. Same layout as the MinoxidilKe admin, in Sky254 blue. */

export type Crumb = { label: string; href?: string };

/** The white bar at the top of every admin page: breadcrumb, title and the page's main buttons. */
export function PageHeader({
  title,
  description,
  action,
  crumbs = [{ label: "Dashboard", href: "/admin" }],
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  crumbs?: Crumb[];
  /** Shows a round back-arrow button before the title. */
  back?: { href: string; label: string };
}) {
  return (
    <div className="-mx-4 mb-6 flex flex-wrap items-center gap-4 border-b border-adm-line bg-white px-4 py-3.5 sm:-mx-7 sm:mb-7 sm:px-7">
      {back && (
        <Link
          href={back.href}
          aria-label={back.label}
          title={back.label}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-adm-line text-adm-body hover:bg-adm-surface hover:text-adm-ink"
        >
          <ArrowLeftIcon className="size-5" aria-hidden />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-[13px] text-adm-muted">
            {crumbs.map((c) => (
              <span key={c.label}>
                {c.href ? (
                  <Link href={c.href} className="hover:text-adm-ink">
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
                <span aria-hidden> › </span>
              </span>
            ))}
            <span className="text-adm-ink">{typeof title === "string" ? title : null}</span>
          </nav>
        )}
        <h1 className="text-[22px] leading-snug font-semibold">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-adm-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2.5">{action}</div>}
    </div>
  );
}

export const buttonClass = {
  primary:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-adm-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-adm-primary-dark disabled:cursor-not-allowed disabled:bg-adm-line-strong disabled:text-adm-muted",
  outline:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-adm-line-strong bg-white px-4 text-sm font-semibold text-adm-ink transition-colors hover:bg-adm-surface disabled:opacity-60",
  small:
    "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full bg-adm-primary px-3.5 text-sm font-semibold text-white transition-colors hover:bg-adm-primary-dark disabled:bg-adm-line-strong",
  smallOutline:
    "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-adm-line-strong bg-white px-3.5 text-sm font-semibold text-adm-ink transition-colors hover:bg-adm-surface disabled:opacity-60",
  danger:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b42318] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#912018] disabled:opacity-60",
  dangerOutline:
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-[#f1b7b0] bg-white px-4 text-sm font-semibold text-[#b42318] transition-colors hover:bg-[#fef3f2] disabled:opacity-60",
};

/** A rounded text input, select or textarea. */
export const FIELD =
  "block w-full rounded-[10px] border border-adm-line-strong bg-white px-3 py-2.5 text-sm text-adm-ink outline-none transition focus:border-adm-primary focus:ring-2 focus:ring-adm-primary/20";

/** The pill-shaped search box at the top of a list. */
export const SEARCH_BOX =
  "flex h-11 min-w-0 items-center gap-2.5 rounded-full border-[1.5px] border-adm-line-strong bg-white px-3.5 focus-within:border-adm-primary";

export const SELECT_PILL = "min-h-11 cursor-pointer rounded-full border-[1.5px] border-adm-line-strong bg-white px-3.5 text-sm";

const TONES = {
  gray: "bg-adm-surface text-adm-body",
  blue: "bg-adm-tint text-adm-primary-dark",
  green: "bg-[#e7f6ec] text-[#116632]",
  amber: "bg-[#fef3e2] text-[#93400d]",
  red: "bg-[#fdecec] text-[#b42318]",
  teal: "bg-adm-teal text-adm-teal-ink",
  indigo: "bg-adm-lavender text-[#4b3f99]",
} as const;
export type Tone = keyof typeof TONES;

/** A rounded status label. `dot` adds a coloured dot before the text. */
export function Badge({ tone = "gray", dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] border border-adm-line bg-white ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[20px] border border-dashed border-adm-line-strong bg-white p-10 text-center text-sm text-adm-muted">{children}</p>;
}

/** What a form action reported: an error in red, or a success line in green. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-[#b42318]">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm text-[#116632]">{state.message}</p>;
  return null;
}

/** Shown while a page's data loads. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-10 text-center text-sm text-adm-muted">{label}</p>;
}

export const ksh = (n: number | null | undefined) => `KSh ${Math.round(Number(n || 0)).toLocaleString("en-KE")}`;

const dateTime = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" });
const timeOnly = new Intl.DateTimeFormat("en-KE", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Nairobi" });
export const formatDateTime = (d: Date | string | null | undefined) => (d ? dateTime.format(new Date(d)) : "—");
export const formatDate = (d: Date | string | null | undefined) => (d ? dateOnly.format(new Date(d)) : "—");
export const formatTime = (d: Date | string | null | undefined) => (d ? timeOnly.format(new Date(d)) : "");

/** "Jane Wanjiru" → "JW". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

/** Avatar colours, picked by position so neighbouring rows differ. */
export const TINTS = [
  "bg-adm-tint text-adm-primary-dark",
  "bg-adm-lavender text-adm-lavender-ink",
  "bg-adm-teal text-adm-teal-ink",
  "bg-adm-peach text-adm-peach-ink",
] as const;
