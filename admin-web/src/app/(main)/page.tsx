import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import {
  getDashboardMetricsApiV1AdminDashboardMetricsGet,
  getBookingTrendsApiV1AdminDashboardBookingTrendsGet,
  getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet,
} from "@/generated/actions/admin";
import { DashboardPage } from "@/features/admin/dashboard";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview with metrics and analytics",
};

// Cache the data fetching functions for better performance
const getDashboardData = cache(async () => {
  try {
    const [metrics, trends, destinations] = await Promise.all([
      getDashboardMetricsApiV1AdminDashboardMetricsGet({}),
      getBookingTrendsApiV1AdminDashboardBookingTrendsGet({
        query: { days: 30 },
      }),
      getPopularDestinationsApiV1AdminDashboardPopularDestinationsGet({
        query: { limit: 10, days: 30 },
      }),
    ]);

    return {
      metrics: metrics?.data || undefined,
      trends: trends?.data || undefined,
      destinations: destinations?.data || undefined,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      metrics: undefined,
      trends: undefined,
      destinations: undefined,
    };
  }
});

export default async function AdminPage() {
  // Fetch initial data on server for faster initial load
  const { metrics, trends, destinations } = await getDashboardData();

  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <DashboardPage
        initialMetrics={metrics}
        initialTrends={trends}
        initialDestinations={destinations}
      />
    </Suspense>
  );
}
