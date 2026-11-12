import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LegalEditor } from "@/components/admin/legal-editor";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { LEGAL_STARTERS } from "@/lib/legal-starters";
import { isLegalSlug, LEGAL_SLUGS, SITE_PAGES } from "@/lib/site-pages";

export const metadata: Metadata = { title: "Legal pages" };

type Params = Promise<{ slug: string }>;

const TABS = LEGAL_SLUGS.map((slug) => ({ slug, title: SITE_PAGES[slug].title, path: SITE_PAGES[slug].path }));

async function Editor({ params }: { params: Params }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_pages").select("body, updated_at").eq("slug", slug).maybeSingle();
  if (error || !data) {
    return <Empty>This page isn&apos;t set up in the database yet. Run the site pages migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  const body = data.body.trim();
  return (
    // key: switching tabs starts the editor fresh from what's saved
    <LegalEditor
      key={slug}
      tabs={TABS}
      slug={slug}
      body={body || LEGAL_STARTERS[slug]}
      starter={LEGAL_STARTERS[slug]}
      updatedAt={body ? data.updated_at : null}
    />
  );
}

export default function LegalPage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader
        title="Legal pages"
        description="The privacy policy, terms, returns & warranty and delivery information. The website links to them from the footer of every page."
      />
      <Suspense fallback={<Loading />}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}
