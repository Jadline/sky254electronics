import type { Metadata } from "next";
import { Suspense } from "react";
import { SubscribersList } from "@/components/admin/subscribers-list";
import { Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Subscribers" };

async function Subscribers() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("newsletter_subscribers").select("id, email, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load subscribers: ${error.message}`);
  return <SubscribersList rows={data.map((row) => ({ id: row.id, email: row.email, joined: row.created_at }))} />;
}

export default function SubscribersPage() {
  return (
    <>
      <PageHeader title="Subscribers" description="People who signed up in the shop's footer for offers and new arrivals." />
      <Suspense fallback={<Loading />}>
        <Subscribers />
      </Suspense>
    </>
  );
}
