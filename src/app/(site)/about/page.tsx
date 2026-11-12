import { AboutPage } from "@/components/about-page";
import { infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("about");

export default function Page() {
  return <AboutPage />;
}
