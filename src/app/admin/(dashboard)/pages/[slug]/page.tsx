import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageEditor } from "@/components/admin/page-editor";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { isSitePageSlug, SITE_PAGES } from "@/lib/site-pages";

export const metadata: Metadata = { title: "Edit page" };

type Params = Promise<{ slug: string }>;

async function Editor({ params }: { params: Params }) {
  const { slug } = await params;
  if (!isSitePageSlug(slug)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_pages").select("title, description, body").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  return <PageEditor slug={slug} path={SITE_PAGES[slug].path} values={data} />;
}

export default function EditPagePage({ params }: { params: Params }) {
  return (
    <>
      <PageHeader
        title="Edit page"
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Pages", href: "/admin/pages" }]}
        back={{ href: "/admin/pages", label: "Back to pages" }}
      />
      <Suspense fallback={<Loading />}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}
