import { Suspense } from "react";
import { Metadata } from "next";
import { AgencyDashboard } from "@/features/agency/components/agency-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/server/session";
import { getAgencyApiV1AgenciesMeGet, listAgencyListingsApiV1AgenciesListingsGet, listAgencyBookingsApiV1AgenciesBookingsGet } from "@/generated/actions/agencies";
import { ActionError } from "@/generated/lib/safe-action";

export const metadata: Metadata = {
  title: "Agency Dashboard",
  description: "Manage your travel agency listings and bookings",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function AgencyDashboardData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    // Fetch agency data
    const [agencyResult, listingsResult, bookingsResult] = await Promise.allSettled([
      getAgencyApiV1AgenciesMeGet(),
      listAgencyListingsApiV1AgenciesListingsGet({ limit: 100 }),
      listAgencyBookingsApiV1AgenciesBookingsGet({ limit: 100 }),
    ]);

    const agency = agencyResult.status === 'fulfilled' ? agencyResult.value : null;
    const listings = listingsResult.status === 'fulfilled' ? (listingsResult.value?.items || []) : [];
    const bookings = bookingsResult.status === 'fulfilled' ? (bookingsResult.value?.items || []) : [];

    // Calculate stats
    const stats = {
      totalListings: listings.length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter((b: any) => b.status === "confirmed").length,
      totalRevenue: bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
    };

    return (
      <AgencyDashboard
        agency={agency}
        listings={listings}
        bookings={bookings}
        stats={stats}
      />
    );
  } catch (error) {
    // Handle NOT_IMPLEMENTED errors gracefully
    if (error instanceof ActionError && error.code === 'NOT_IMPLEMENTED') {
      console.info("[Agency Dashboard] API not yet implemented");
    } else {
      console.error("[Agency Dashboard] Error:", error);
    }
    
    return (
      <AgencyDashboard
        agency={null}
        listings={[]}
        bookings={[]}
        stats={{
          totalListings: 0,
          totalBookings: 0,
          activeBookings: 0,
          totalRevenue: 0,
        }}
      />
    );
  }
}

function AgencyDashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-[18px]" />
    </div>
  );
}

export default function AgencyDashboardPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Suspense fallback={<AgencyDashboardLoading />}>
          <AgencyDashboardData />
        </Suspense>
      </div>
    </div>
  );
}

