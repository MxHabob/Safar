import { Suspense } from "react";
import { Metadata } from "next";
import { DiscoverView } from "@/pages/discover/discover-view";

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover amazing travel destinations on an interactive map. Explore places, find inspiration, and plan your next adventure.",
  keywords: ["discover", "map", "travel destinations", "interactive", "explore"],
  openGraph: {
    title: "Discover - Safar",
    description: "Discover amazing travel destinations on an interactive map",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover - Safar",
    description: "Discover amazing travel destinations on an interactive map",
  },
  alternates: {
    canonical: "/discover",
  },
};

const page = () => {
  return (
    <div className="w-full h-[calc(100vh-1.5rem)]">
      <Suspense fallback={<div className="w-full h-full rounded-xl bg-muted animate-pulse" />}>
        <DiscoverView />
      </Suspense>
    </div>
  );
};

export default page;
