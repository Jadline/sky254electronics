import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import type { SettingsRow } from "@/lib/settings";

export const metadata: Metadata = { title: "Shop settings" };

async function Settings() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("shop_settings")
    .select("email, address, hours, facebook_url, instagram_url, tiktok_url, nairobi_fee_kes, countrywide_fee_kes, free_delivery_over_kes")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return <Empty>Shop settings aren&apos;t set up in the database yet. Run the settings migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  return <SettingsForm values={data as SettingsRow} />;
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Shop settings" description="Your shop's details, social links and delivery fees. Changes go live straight away." />
      <Suspense fallback={<Loading />}>
        <Settings />
      </Suspense>
    </>
  );
}
