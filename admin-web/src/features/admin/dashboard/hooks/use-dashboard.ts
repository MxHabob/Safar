"use client";

import { useMemo } from "react";
import {
  useGetDashboardMetricsApiV1AdminDashboardMetricsGet,
  useGetBookingTrendsApiV1AdminDashboardBookingTrendsGet,
  useGetPopularDestinationsApiV1AdminDashboardPopularDestinationsGet,
} from "@/generated/hooks/admin";
import type {
  GetDashboardMetricsApiV1AdminDashboardMetricsGetResponse,
  GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponse,
  GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponse,
} from "@/generated/schemas";

interface UseDashboardProps {
  initialMetrics?: GetDashboardMetricsApiV1AdminDashboardMetricsGetResponse;
  initialTrends?: GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponse;
  initialDestinations?: GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponse;
  periodDays?: number;
}

export function useDashboard({
  initialMetrics,
  initialTrends,
  initialDestinations,
  periodDays = 30,
}: UseDashboardProps = {}) {
  // Fetch dashboard metrics
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useGetDashboardMetricsApiV1AdminDashboardMetricsGet(undefined, undefined, {
    initialData: initialMetrics,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch booking trends
  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
  } = useGetBookingTrendsApiV1AdminDashboardBookingTrendsGet(periodDays, {
    initialData: initialTrends,
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch popular destinations
  const {
    data: destinationsData,
    isLoading: destinationsLoading,
    error: destinationsError,
  } = useGetPopularDestinationsApiV1AdminDashboardPopularDestinationsGet(10, periodDays, {
    initialData: initialDestinations,
    refetchInterval: 5 * 60 * 1000,
  });

  // Transform metrics data for easier consumption
  const metrics = useMemo(() => {
    if (!metricsData) return undefined;

    return {
      bookings: {
        total: metricsData.bookings?.total || 0,
        change: metricsData.bookings?.change_percentage || 0,
        completed: metricsData.bookings?.completed || 0,
        pending: metricsData.bookings?.pending || 0,
      },
      revenue: {
        total: metricsData.revenue?.total || 0,
        change: metricsData.revenue?.change_percentage || 0,
        this_month: metricsData.revenue?.this_month || 0,
        last_month: metricsData.revenue?.last_month || 0,
      },
      users: {
        total: metricsData.users?.total || 0,
        change: metricsData.users?.change_percentage || 0,
        active: metricsData.users?.active || 0,
        new: metricsData.users?.new || 0,
      },
      listings: {
        total: metricsData.listings?.total || 0,
        change: metricsData.listings?.change_percentage || 0,
        active: metricsData.listings?.active || 0,
        pending: metricsData.listings?.pending || 0,
      },
    };
  }, [metricsData]);

  // Extract trends array
  const trends = useMemo(() => {
    return trendsData?.trends || [];
  }, [trendsData]);

  // Extract destinations array
  const destinations = useMemo(() => {
    return destinationsData?.destinations || [];
  }, [destinationsData]);

  return {
    metrics,
    trends,
    destinations,
    periodDays,
    isLoading: metricsLoading || trendsLoading || destinationsLoading,
    errors: {
      metrics: metricsError,
      trends: trendsError,
      destinations: destinationsError,
    },
  };
}

