import { Suspense } from "react";
import { Metadata } from "next";
import {
  TravelView,
  LoadingStatus,
} from "@/features/travel-guides/travel-view";
import { getGuidesApiV1TravelGuidesGet } from "@/generated/actions/travelGuides";

export const metadata: Metadata = {
  title: "Travel Guides",
  description: "Discover amazing travel destinations and guides. Explore curated travel guides, tips, and stories from around the world.",
  keywords: ["travel guides", "destinations", "travel tips", "adventure", "exploration"],
  openGraph: {
    title: "Travel Guides - Safar",
    description: "Discover amazing travel destinations and guides",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Guides - Safar",
    description: "Discover amazing travel destinations and guides",
  },
  alternates: {
    canonical: "/travel",
  },
};

async function TravelData() {
  try {
    const data = await getGuidesApiV1TravelGuidesGet({
      query: {
        status: "published",
        limit: 50,
      },
    });

    // Ensure data is always an array
    const guides = Array.isArray(data) ? data : [];
    
    return <TravelView data={guides} />;
  } catch (error) {
    console.error("Error fetching travel guides:", error);
    return <TravelView data={[]} />;
  }
}

const page = () => {
  return (
    <Suspense fallback={<LoadingStatus />}>
      <TravelData />
    </Suspense>
  );
};

export default page;

