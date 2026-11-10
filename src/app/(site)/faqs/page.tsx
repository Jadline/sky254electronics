import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("faqs");

export default function Page() {
  return <InfoPage slug="faqs" />;
}
