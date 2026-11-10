import { ArrowTopRightOnSquareIcon, PencilIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass, Empty, formatDate, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { isSitePageSlug, SITE_PAGES } from "@/lib/site-pages";

export const metadata: Metadata = { title: "Pages" };

async function Pages() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_pages").select("slug, title, updated_at");
  if (error || !data?.length) {
    return <Empty>The pages aren&apos;t set up in the database yet. Run the site pages migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  const bySlug = new Map(data.map((row) => [row.slug, row]));

  return (
    <section aria-labelledby="pages-h" className="max-w-4xl rounded-[20px] border border-adm-line bg-white">
      <h2 id="pages-h" className="sr-only">Information pages</h2>
      <ul className="divide-y divide-adm-line-soft">
        {Object.entries(SITE_PAGES).map(([slug, info]) => {
          const row = isSitePageSlug(slug) ? bySlug.get(slug) : undefined;
          return (
            <li key={slug} className="flex flex-wrap items-center gap-3 px-[22px] py-4">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{row?.title ?? info.title}</span>
                <span className="text-[13px] text-adm-muted">
                  {info.path} · {row ? `Last edited ${formatDate(row.updated_at)}` : "Not set up"}
                </span>
              </span>
              <a href={info.path} target="_blank" rel="noreferrer" className={buttonClass.smallOutline}>
                <ArrowTopRightOnSquareIcon className="size-4" aria-hidden />
                View
              </a>
              {row && (
                <Link href={`/admin/pages/${slug}`} className={buttonClass.small}>
                  <PencilIcon className="size-4" aria-hidden />
                  Edit
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function PagesPage() {
  return (
    <>
      <PageHeader
        title="Pages"
        description="The wording of About, Contact, FAQs, Delivery, Returns, Privacy and Terms. Fees, address and hours come from Shop settings."
      />
      <Suspense fallback={<Loading />}>
        <Pages />
      </Suspense>
    </>
  );
}
