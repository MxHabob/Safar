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
    if (!metricsData?.data) return undefined;

    const data = metricsData.data;
    return {
      bookings: {
        total: data.bookings?.total || 0,
        change: data.bookings?.change_percentage || 0,
        completed: data.bookings?.completed || 0,
        pending: data.bookings?.pending || 0,
      },
      revenue: {
        total: data.revenue?.total || 0,
        change: data.revenue?.change_percentage || 0,
        this_month: data.revenue?.this_month || 0,
        last_month: data.revenue?.last_month || 0,
      },
      users: {
        total: data.users?.total || 0,
        change: data.users?.change_percentage || 0,
        active: data.users?.active || 0,
        new: data.users?.new || 0,
      },
      listings: {
        total: data.listings?.total || 0,
        change: data.listings?.change_percentage || 0,
        active: data.listings?.active || 0,
        pending: data.listings?.pending || 0,
      },
    };
  }, [metricsData]);

  // Extract trends array
  const trends = useMemo(() => {
    return trendsData?.data?.trends || [];
  }, [trendsData]);

  // Extract destinations array
  const destinations = useMemo(() => {
    return destinationsData?.data?.destinations || [];
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

