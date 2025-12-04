import { Suspense } from "react";
import { Metadata } from "next";

import ProfileCard from "@/pages/home/components/profile-card";
import LatestTravelCard from "@/pages/home/components/latest-travel-card";
import Footer from "@/components/footer";

import {
  CitiesView,
  CitiesViewLoadingStatus,
} from "@/pages/home/cities-view";
import {
  SliderViewLoadingStatus,
  SliderView,
} from "@/pages/home/slider-view";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Safar - Discover amazing travel destinations and stories",
  keywords: ["travel", "travel guides", "destinations", "photography", "stories"],
  openGraph: {
    title: "Safar - Travel Guides & Stories",
    description: "Welcome to Safar - Discover amazing travel destinations and stories",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safar - Travel Guides & Stories",
    description: "Discover amazing travel destinations and stories",
  },
  alternates: {
    canonical: "/",
  },
};

const page = async () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      {/* LEFT CONTENT - Fixed */}
      <div className="w-full lg:w-1/2 h-[70vh] lg:fixed lg:top-0 lg:left-0 lg:h-screen p-0 lg:p-3 rounded-xl">
        <Suspense fallback={<SliderViewLoadingStatus />}>
          <SliderView />
        </Suspense>
      </div>
      {/* Spacer for fixed left content */}
      <div className="hidden lg:block lg:w-1/2" />
      {/* RIGHT CONTENT - Scrollable */}
      <div className="w-full mt-3 lg:mt-0 lg:w-1/2 space-y-3 pb-3">
        {/* PROFILE CARD  */}
        <ProfileCard />

        {/* LAST TRAVEL CARD  */}
        <LatestTravelCard />

        {/* CITY SETS CARD  */}
        <Suspense fallback={<CitiesViewLoadingStatus />}>
          <CitiesView />
        </Suspense>

        <Footer />
      </div>
    </div>
  );
};

export default page;
