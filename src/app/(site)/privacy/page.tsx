import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("privacy");

export default function Page() {
  return <InfoPage slug="privacy" />;
}
