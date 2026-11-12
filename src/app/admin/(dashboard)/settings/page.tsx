import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { SETTINGS_COLUMNS, type SettingsRow } from "@/lib/settings";

export const metadata: Metadata = { title: "Shop settings" };

async function Settings() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("shop_settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle<SettingsRow>();
  if (error || !data) {
    return <Empty>Shop settings aren&apos;t set up in the database yet. Run the settings migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  return <SettingsForm values={data} />;
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Shop settings" description="The shop details the website shows on every page." />
      <Suspense fallback={<Loading />}>
        <Settings />
      </Suspense>
    </>
  );
}
