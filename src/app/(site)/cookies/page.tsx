import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("cookies");

export default function Page() {
  return <InfoPage slug="cookies" />;
}
