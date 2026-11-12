import { redirect } from "next/navigation";
import { LEGAL_SLUGS } from "@/lib/site-pages";

/** Opens the first tab. */
export default function LegalPagesIndex() {
  redirect(`/admin/legal/${LEGAL_SLUGS[0]}`);
}
