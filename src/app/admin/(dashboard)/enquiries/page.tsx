import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiriesList, type EnquiryRow } from "@/components/admin/enquiries-list";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Enquiries" };

async function Enquiries() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("enquiries")
    .select("id, name, phone, email, topic, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    return <Empty>Enquiries aren&apos;t set up in the database yet. Run the enquiries migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  return <EnquiriesList rows={data as EnquiryRow[]} />;
}

export default function EnquiriesPage() {
  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent from the Contact page. Reply by phone, WhatsApp or email, then mark them done." />
      <Suspense fallback={<Loading />}>
        <Enquiries />
      </Suspense>
    </>
  );
}
