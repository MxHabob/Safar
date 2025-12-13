import { Suspense } from "react";
import { Metadata } from "next";
import { HostAnalytics, HostAnalyticsLoading } from "@/features/host/components/host-analytics";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { listHostBookingsApiV1BookingsHostListingsGet } from "@/generated/actions/bookings";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Analytics - Host Dashboard",
  description: "View your hosting analytics and performance metrics",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function AnalyticsData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    // Use server-side filtering for bookings via host endpoint
    const [listingsResult, bookingsResult] = await Promise.all([
      listListingsApiV1ListingsGet({
        query: { limit: 100 },
      }).catch((error) => {
        console.error("[Host Analytics] Failed to fetch listings:", error);
        return { data: { items: [] } };
      }),
      listHostBookingsApiV1BookingsHostListingsGet({
        query: { limit: 100 },
      }).catch((error) => {
        console.error("[Host Analytics] Failed to fetch host bookings:", error);
        return { data: { items: [] } };
      }),
    ]);

    // Filter listings by host (client-side - API limitation)
    const allListings = listingsResult?.data?.items || [];
    const listings = allListings.filter((listing: any) => 
      listing.host_id === user.id || listing.host?.id === user.id
    );
    
    // Bookings are already filtered server-side
    const bookings = bookingsResult?.data?.items || [];

    return <HostAnalytics listings={listings} bookings={bookings} />;
  } catch (error) {
    console.error("[Host Analytics] Unexpected error:", error);
    return <HostAnalytics listings={[]} bookings={[]} />;
  }
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Analytics</h1>
          <p className="text-muted-foreground font-light">
            View your hosting performance and insights
          </p>
        </div>
        <Suspense fallback={<HostAnalyticsLoading />}>
          <AnalyticsData />
        </Suspense>
      </div>
    </div>
  );
}

