import { Suspense } from "react";
import { Metadata } from "next";
import { HostAnalytics, HostAnalyticsLoading } from "@/features/host/components/host-analytics";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { listBookingsApiV1BookingsGet } from "@/generated/actions/bookings";
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
    const [listingsResult, bookingsResult] = await Promise.all([
      listListingsApiV1ListingsGet({
        query: {},
      }).catch(() => ({ data: { items: [] } })),
      listBookingsApiV1BookingsGet({
        query: {},
      }).catch(() => ({ data: { items: [] } })),
    ]);

    const allListings = listingsResult?.data?.items || [];
    const allBookings = bookingsResult?.data?.items || [];
    
    const listings = allListings.filter((listing: any) => 
      listing.host_id === user.id || listing.host?.id === user.id
    );
    const bookings = allBookings.filter((booking: any) => 
      booking.host_id === user.id || booking.listing?.host_id === user.id
    );

    return <HostAnalytics listings={listings} bookings={bookings} />;
  } catch (error) {
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

