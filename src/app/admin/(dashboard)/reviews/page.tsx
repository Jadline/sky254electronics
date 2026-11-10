import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewsList, type ReviewRow } from "@/components/admin/reviews-list";
import { Empty, Loading, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Reviews" };

async function Reviews() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, name, rating, title, body, phone, verified, status, created_at, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    return <Empty>Reviews aren&apos;t set up in the database yet. Run the reviews migration in the Supabase SQL Editor, then reload.</Empty>;
  }
  return <ReviewsList rows={data as unknown as ReviewRow[]} />;
}

export default function ReviewsPage() {
  return (
    <>
      <PageHeader title="Reviews" description="Customers' product reviews. They show on the product page, and as stars in Google, once you approve them." />
      <Suspense fallback={<Loading />}>
        <Reviews />
      </Suspense>
    </>
  );
}
