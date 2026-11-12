"use client";

// Dashboard → Legal pages: the privacy policy, terms, returns & warranty and delivery information.
//   tabs (one per page, /admin/legal/<slug>) → status line (starter text or last saved)
//   → the page in a what-you-see-is-what-you-get editor, with paste tips and its sections beside it
// The website shows the starter text (lib/legal-starters.ts) until a page is saved here.
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveLegalPage } from "@/app/admin/legal-actions";
import { ConfirmDialog } from "@/components/admin/dialogs";
import { EDITOR_CONTENT_CLASS, RichTextEditor } from "@/components/admin/rich-text-editor";
import { buttonClass } from "@/components/admin/ui";
import { headings } from "@/components/rich-text";
import type { LegalSlug } from "@/lib/site-pages";

export type LegalTab = { slug: LegalSlug; title: string; path: string };

const BOX = "rounded-[20px] border border-adm-line bg-white";
const same = (a: string, b: string) => a.trim() === b.trim();

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return "just now";
}

export function LegalEditor({
  tabs,
  slug,
  body: savedBody,
  starter,
  updatedAt: savedAt,
}: {
  tabs: LegalTab[];
  slug: LegalSlug;
  body: string;
  starter: string;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const page = tabs.find((t) => t.slug === slug)!;
  const [saved, setSaved] = useState({ body: savedBody, at: savedAt });
  const [body, setBody] = useState(savedBody);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = !same(body, saved.body);
  const isStarter = saved.at === null || same(saved.body, starter);

  // Warn before closing the tab or reloading with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    setResult(null);
    startSaving(async () => {
      const res = await saveLegalPage(slug, body);
      if (res.ok) {
        setSaved({ body, at: res.updatedAt });
        setResult({ ok: true, text: `${page.title} saved. It's live on the website.` });
        router.refresh();
      } else {
        setResult({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {/* One tab per page */}
      <nav aria-label="Legal pages" className="-mb-px flex gap-1 overflow-x-auto border-b border-adm-line">
        {tabs.map((tab) => {
          const active = tab.slug === slug;
          const href = `/admin/legal/${tab.slug}`;
          return (
            <Link
              key={tab.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                if (active || !dirty) return;
                event.preventDefault();
                setLeaveTo(href);
              }}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                active ? "border-adm-primary font-semibold text-adm-ink" : "border-transparent text-adm-muted hover:text-adm-ink"
              }`}
            >
              {tab.title}
            </Link>
          );
        })}
      </nav>

      {/* Where this page stands, and the main actions */}
      <div className={`${BOX} flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between`}>
        <div className="text-sm text-adm-body">
          {isStarter ? (
            <p className="flex items-start gap-2">
              <ExclamationTriangleIcon className="mt-0.5 size-[18px] shrink-0 text-[#b54708]" aria-hidden />
              <span>
                <span className="font-semibold text-adm-ink">The website is showing our starter text.</span> It&apos;s a plain-English draft, not legal advice:
                check it against how you really work (returns window, warranty, delivery times) and ideally have a lawyer read it, then save.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2">
              <CheckCircleIcon className="mt-0.5 size-[18px] shrink-0 text-[#116632]" aria-hidden />
              {/* "Last saved 3 minutes ago" can tick over between the server and the browser. */}
              <span suppressHydrationWarning>
                <span className="font-semibold text-adm-ink">Live on the website.</span> Last saved {timeAgo(saved.at!)}
                {slug === "delivery" ? "; your delivery fees from Delivery are shown under it." : "; the page shows this as “Last updated”."}
              </span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={page.path} target="_blank" rel="noreferrer" className={buttonClass.smallOutline}>
            <ArrowTopRightOnSquareIcon className="size-4" aria-hidden /> View on website
          </a>
          <button type="button" onClick={() => setConfirmReset(true)} disabled={same(body, starter)} className={buttonClass.smallOutline}>
            <ArrowPathIcon className="size-4" aria-hidden /> Reset to starter text
          </button>
          <button type="button" onClick={save} disabled={!dirty || saving} className={buttonClass.small}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-2">
          <RichTextEditor label={page.title} value={body} onChange={setBody} />
          <p role="status" className="px-1 text-[13px]">
            {result ? (
              <span className={result.ok ? "text-[#116632]" : "text-[#b42318]"}>{result.text}</span>
            ) : dirty ? (
              <span className="font-semibold text-[#b54708]">Unsaved changes: press Save to publish them.</span>
            ) : (
              <span className="text-adm-muted">Everything is saved.</span>
            )}
          </p>
        </div>
        <EditorGuide body={body} />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Replace with the starter text?"
        confirmLabel="Use starter text"
        pending={false}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setBody(starter);
          setResult(null);
          setConfirmReset(false);
        }}
      >
        Your wording in the editor is replaced by our starter draft. Nothing changes on the website until you press Save.
      </ConfirmDialog>
      <ConfirmDialog
        open={leaveTo !== null}
        title="Leave without saving?"
        confirmLabel="Leave page"
        pending={false}
        onClose={() => setLeaveTo(null)}
        onConfirm={() => {
          const href = leaveTo!;
          setLeaveTo(null);
          router.push(href);
        }}
      >
        Your changes to the {page.title.toLowerCase()} haven&apos;t been saved and will be lost.
      </ConfirmDialog>
    </div>
  );
}

/** Beside the editor: how to get a document in, and its sections (click one to jump to it). */
function EditorGuide({ body }: { body: string }) {
  const sections = headings(body);

  function jumpTo(index: number) {
    document.querySelectorAll(`.${EDITOR_CONTENT_CLASS} h2`)[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <aside className="flex flex-col gap-[18px] xl:sticky xl:top-4">
      <div className={`${BOX} px-5 py-4 text-sm`}>
        <p className="flex items-center gap-2 font-semibold text-adm-ink">
          <ClipboardDocumentListIcon className="size-[18px] text-adm-primary" aria-hidden /> Pasting a policy
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 text-adm-body">
          <li>Copy from Word, Google Docs or a policy generator and paste: headings and lists come with it.</li>
          <li>
            To make a line a heading, click in it and choose <span className="font-semibold text-adm-ink">Heading</span> in the toolbar.
          </li>
          <li>Leave out the page title: the website already shows it.</li>
          <li>Phone, address, hours and delivery fees are added to the site from Shop settings and Delivery, so you don&apos;t need to type them.</li>
        </ul>
      </div>
      {sections.length > 0 && (
        <nav aria-label="Sections" className={`${BOX} px-5 py-4 text-sm`}>
          <p className="flex items-center gap-2 font-semibold text-adm-ink">
            <QueueListIcon className="size-[18px] text-adm-primary" aria-hidden /> Sections{" "}
            <span className="font-normal text-adm-muted">({sections.length})</span>
          </p>
          <ol className="mt-2 flex flex-col gap-0.5">
            {sections.map((section, index) => (
              <li key={`${section}-${index}`}>
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  className="w-full cursor-pointer rounded-lg px-2 py-1 text-left text-adm-body hover:bg-adm-surface hover:text-adm-ink"
                >
                  {section}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </aside>
  );
}
