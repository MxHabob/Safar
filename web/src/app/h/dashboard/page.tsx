import { Suspense } from "react";
import { Metadata } from "next";
import { HostDashboard } from "@/features/host/host-dashboard";
import { HostListingsLoading } from "@/features/host/components/host-listings";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { listHostBookingsApiV1BookingsHostListingsGet } from "@/generated/actions/bookings";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Host Dashboard",
  description: "Manage your listings and bookings",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function HostDashboardData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    // Use server-side filtering for bookings via host endpoint
    // For listings: try host_id filter if available, fallback to client-side filtering
    const [listingsResult, bookingsResult] = await Promise.all([
      // TODO: When backend supports host_id filter, use:
      // listListingsApiV1ListingsGet({ query: { host_id: user.id, limit: 100 } })
      // For now, fetch all and filter client-side
      listListingsApiV1ListingsGet({
        query: { limit: 100 }, // Fetch more to ensure we get all host listings
      }).catch((error) => {
        console.error("[Host Dashboard] Failed to fetch listings:", error);
        return { data: { items: [] } };
      }),
      listHostBookingsApiV1BookingsHostListingsGet({
        query: { limit: 100 }, // Fetch all host bookings server-side
      }).catch((error) => {
        console.error("[Host Dashboard] Failed to fetch host bookings:", error);
        return { data: { items: [] } };
      }),
    ]);

    // Filter listings by host (client-side - API limitation)
    // TODO: Remove this client-side filtering when backend supports host_id query parameter
    // See BACKEND_API_REQUIREMENTS.md for details
    const allListings = listingsResult?.data?.items || [];
    const listings = allListings.filter((listing: any) => 
      listing.host_id === user.id || listing.host?.id === user.id
    );
    
    // Bookings are already filtered server-side via host endpoint
    const bookings = bookingsResult?.data?.items || [];

    // Calculate stats
    const stats = {
      totalListings: listings.length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter((b: any) => b.status === "confirmed").length,
      totalRevenue: bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
    };

    return <HostDashboard listings={listings} bookings={bookings} stats={stats} />;
  } catch (error) {
    console.error("[Host Dashboard] Unexpected error:", error);
    // Return empty state on error - component should handle gracefully
    return <HostDashboard listings={[]} bookings={[]} stats={{
      totalListings: 0,
      totalBookings: 0,
      activeBookings: 0,
      totalRevenue: 0,
    }} />;
  }
}

export default function HostDashboardPage() {
  return (
    <Suspense fallback={<HostListingsLoading />}>
      <HostDashboardData />
    </Suspense>
  );
}

