import { Suspense } from "react";
import { Metadata } from "next";
import { DiscoverView } from "@/pages/discover/discover-view";

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover amazing travel destinations on an interactive map",
  openGraph: {
    title: "Discover - Safar",
    description: "Discover amazing travel destinations on an interactive map",
  },
};

const page = () => {
  return (
    <Suspense fallback={<div className="w-full h-screen rounded-xl bg-muted animate-pulse" />}>
      <DiscoverView />
    </Suspense>
  );
};

export default page;
