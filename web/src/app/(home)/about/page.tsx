import { type Metadata } from "next";
import Footer from "@/components/footer";
import { AboutView } from "@/pages/about/about-view";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Safar - the smartest, most distinctive, and seamless travel platform in the world. Discover our mission, values, and commitment to transforming travel experiences.",
  keywords: ["about", "travel platform", "mission", "values", "company"],
  openGraph: {
    title: "About - Safar",
    description: "Learn more about Safar - the smartest travel platform in the world",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary",
    title: "About - Safar",
    description: "Learn more about Safar - the smartest travel platform",
  },
  alternates: {
    canonical: "/about",
  },
};

/**
 * About page - Company information and mission
 * Beautiful, minimal design following Safar's aesthetic
 */
const AboutPage = () => {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-16 lg:py-24">
        <AboutView />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
