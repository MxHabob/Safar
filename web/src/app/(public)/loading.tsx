import { HeroSliderLoading } from "@/features/home/hero-slider";
import { TravelGuidesViewLoading } from "@/features/home/travel-guides-view";
import Footer from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for root page
 * Matches the structure of the main page for seamless transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen w-full">
      {/* MINIMAL HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center p-3 lg:p-6">
        <div className="absolute inset-0 rounded-[18px] overflow-hidden bg-muted/30">
          <HeroSliderLoading />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <Skeleton className="h-20 w-96 mx-auto mb-6" />
          <Skeleton className="h-6 w-64 mx-auto mb-12" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-16 lg:py-24 space-y-24 lg:space-y-32">
        {/* Editorial Destinations */}
        <section className="space-y-12">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-[18px]" />
            ))}
          </div>
        </section>

        {/* Curated Listings */}
        <section className="space-y-12">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-[18px]" />
            ))}
          </div>
        </section>

        {/* Travel Guides */}
        <section className="space-y-12">
          <Skeleton className="h-10 w-64" />
          <TravelGuidesViewLoading />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

