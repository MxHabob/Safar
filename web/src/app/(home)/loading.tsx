import { SliderViewLoadingStatus } from "@/pages/home/slider-view";
import { CitiesViewLoadingStatus } from "@/pages/home/cities-view";
import ProfileCard from "@/pages/home/components/profile-card";
import LatestTravelCard from "@/pages/home/components/latest-travel-card";
import Footer from "@/components/footer";

/**
 * Loading state for root page
 * Matches the structure of the main page for seamless transitions
 */
export default function Loading() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full">
      {/* LEFT CONTENT - Fixed */}
      <div className="w-full lg:w-1/2 h-[70vh] lg:fixed lg:top-0 lg:left-0 lg:h-screen p-0 lg:p-3">
        <div className="h-full w-full rounded-[18px] overflow-hidden">
          <SliderViewLoadingStatus />
        </div>
      </div>
      {/* Spacer for fixed left content */}
      <div className="hidden lg:block lg:w-1/2" />
      {/* RIGHT CONTENT - Scrollable */}
      <div className="w-full mt-3 lg:mt-0 lg:w-1/2 space-y-3 pb-3 px-3 lg:px-0">
        <ProfileCard />
        <LatestTravelCard />
        <CitiesViewLoadingStatus />
        <Footer />
      </div>
    </div>
  );
}

