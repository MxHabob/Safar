"use client";

import { Suspense } from "react";
import { MetricsCards } from "./components/metrics-cards";
import { BookingTrendsChart } from "./components/booking-trends-chart";
import { PopularDestinations } from "./components/popular-destinations";
import { useDashboard } from "./hooks/use-dashboard";
import { Spinner } from "@/components/ui/spinner";
import type {
  GetDashboardMetricsApiV1AdminDashboardMetricsGetResponse,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponse,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponse,
} from "@/generated/schemas";

interface DashboardPageProps {
  initialMetrics?: GetDashboardMetricsApiV1AdminDashboardMetricsGetResponse;
  initialTrends?: GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponse;
  initialDestinations?: GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponse;
}

function DashboardContent({
  initialMetrics,
  initialTrends,
  initialDestinations,
}: DashboardPageProps) {
  const { metrics, trends, destinations, periodDays, isLoading } = useDashboard({
    initialMetrics,
    initialTrends,
    initialDestinations,
    periodDays: 30,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your platform metrics and analytics
        </p>
      </div>

      <MetricsCards metrics={metrics} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <BookingTrendsChart
          trends={trends}
          periodDays={periodDays}
          isLoading={isLoading}
        />
        <PopularDestinations
          destinations={destinations}
          periodDays={periodDays}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export function DashboardPage(props: DashboardPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <DashboardContent {...props} />
    </Suspense>
  );
}

