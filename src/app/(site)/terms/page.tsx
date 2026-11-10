import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("terms");

export default function Page() {
  return <InfoPage slug="terms" />;
}
