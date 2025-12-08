import { Suspense } from "react";
import { Metadata } from "next";
import { HostDashboard } from "@/features/host/host-dashboard";
import { HostListingsLoading } from "@/features/host/components/host-listings";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { listBookingsApiV1BookingsGet } from "@/generated/actions/bookings";
import { getSession } from "@/lib/auth/session-provider";

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
  const session = await getSession().catch(() => null);

  if (!session) {
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

    // Filter listings and bookings by host (client-side filtering)
    const allListings = listingsResult?.data?.items || [];
    const allBookings = bookingsResult?.data?.items || [];
    
    const listings = allListings.filter((listing: any) => 
      listing.host_id === session.user.id || listing.host?.id === session.user.id
    );
    const bookings = allBookings.filter((booking: any) => 
      booking.host_id === session.user.id || booking.listing?.host_id === session.user.id
    );

    // Calculate stats
    const stats = {
      totalListings: listings.length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter((b: any) => b.status === "confirmed").length,
      totalRevenue: bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
    };

    return <HostDashboard listings={listings} bookings={bookings} stats={stats} />;
  } catch (error) {
    return <HostDashboard listings={[]} bookings={[]} />;
  }
}

export default function HostDashboardPage() {
  return (
    <Suspense fallback={<HostListingsLoading />}>
      <HostDashboardData />
    </Suspense>
  );
}

