"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { saveSitePage } from "@/app/admin/page-actions";
import { buttonClass, FIELD, FormMessage } from "@/components/admin/ui";
import { PAGE_LIMITS, type SitePageSlug } from "@/lib/site-pages";

const CARD = "flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-[22px] py-5";

const HELP: [string, string][] = [
  ["## Heading", "a section heading"],
  ["- item", "a bullet point"],
  ["**words**", "bold"],
  ["[text](/delivery)", "a link"],
  ["blank line", "a new paragraph"],
];

export function PageEditor({
  slug,
  path,
  values,
}: {
  slug: SitePageSlug;
  path: string;
  values: { title: string; description: string | null; body: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSitePage, {});
  const [description, setDescription] = useState(values.description ?? "");

  return (
    <form action={action} className="grid max-w-6xl items-start gap-[18px] lg:grid-cols-[1fr_280px]">
      <input type="hidden" name="slug" value={slug} />
      <section aria-labelledby="pe-h" className={CARD}>
        <h2 id="pe-h" className="sr-only">Page wording</h2>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Title
          <input name="title" required maxLength={PAGE_LIMITS.title} defaultValue={values.title} className={`${FIELD} font-normal`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Google description
          <textarea
            name="description"
            rows={2}
            maxLength={PAGE_LIMITS.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${FIELD} font-normal`}
          />
          <span className="text-[13px] font-normal text-adm-muted">
            The summary under the link in Google. About 160 characters shows in full ({description.length} now).
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Page text
          <textarea name="body" rows={24} maxLength={PAGE_LIMITS.body} defaultValue={values.body} className={`${FIELD} font-mono text-[13px] leading-relaxed font-normal`} />
          {slug === "faqs" && (
            <span className="text-[13px] font-normal text-adm-muted">Each “## ” heading is a question. The text under it is the answer.</span>
          )}
        </label>
        <FormMessage state={state} />
        <div className="flex flex-wrap gap-2.5">
          <button type="submit" disabled={pending} className={buttonClass.primary}>
            {pending ? "Saving…" : "Save page"}
          </button>
          <a href={path} target="_blank" rel="noreferrer" className={buttonClass.outline}>
            <ArrowTopRightOnSquareIcon className="size-[18px]" aria-hidden />
            View page
          </a>
        </div>
      </section>

      <aside className={`${CARD} text-sm`}>
        <h2 className="font-semibold">Formatting</h2>
        <dl className="grid gap-2.5">
          {HELP.map(([code, meaning]) => (
            <div key={code} className="flex flex-col">
              <dt><code className="rounded bg-adm-surface px-1.5 py-0.5 text-[13px]">{code}</code></dt>
              <dd className="text-adm-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-adm-line-soft pt-3 text-adm-muted">
          Phone, address, hours, email and delivery fees are added to the page from Shop settings, so you don&apos;t need to type them here.
        </p>
      </aside>
    </form>
  );
}
