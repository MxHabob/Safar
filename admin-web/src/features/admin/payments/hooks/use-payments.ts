"use client";

import { useMemo, useCallback, useState } from "react";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import { useListPaymentsApiV1AdminPaymentsGet } from "@/generated/hooks/admin";
import type {
  ListPaymentsApiV1AdminPaymentsGetResponse,
  AdminPaymentResponse,
} from "@/generated/schemas";

const searchParamsConfig = {
  status: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(50), // Larger default for big data
};

interface UsePaymentsProps {
  initialPaymentsData?: ListPaymentsApiV1AdminPaymentsGetResponse;
}

export function usePayments({ initialPaymentsData }: UsePaymentsProps = {}) {
  // Use nuqs for URL state management - better performance and type safety
  const [searchParams, setSearchParams] = useQueryStates(searchParamsConfig, {
    history: "push",
    shallow: false,
  });

  // Extract filters from URL params
  const filters = useMemo(
    () => ({
      query: {
        status: searchParams.status !== "all" ? searchParams.status : undefined,
      },
    }),
    [searchParams]
  );

  // Convert URL pagination to component state
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: searchParams.page,
      pageSize: searchParams.pageSize,
    }),
    [searchParams.page, searchParams.pageSize]
  );

  // Default sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  // Check if we should use initial data (only when no filters are applied and on first page)
  const shouldUseInitialData =
    filters.query.status === undefined && pagination.pageIndex === 0;

  // Fetch payments from API with filters - API handles filtering and pagination
  const { data, isLoading, error } = useListPaymentsApiV1AdminPaymentsGet(
    pagination.pageIndex * pagination.pageSize, // skip
    pagination.pageSize, // limit
    filters.query.status, // status
    {
      enabled: true,
      initialData: shouldUseInitialData ? initialPaymentsData : undefined,
    }
  );

  // Extract payments from API response
  const payments = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data.items) ? data.items : [];
  }, [data]);

  const totalCount = data?.total || 0;

  // Apply client-side sorting (API should handle this, but keeping for now)
  const sortedPayments = useMemo(() => {
    if (!payments || payments.length === 0 || sorting.length === 0)
      return payments;

    const compareValues = (
      a: number | string | Date,
      b: number | string | Date,
      desc: boolean
    ): number => {
      const direction = desc ? -1 : 1;
      if (a === b) return 0;
      if (a == null) return direction;
      if (b == null) return -direction;

      if (typeof a === "string" && typeof b === "string") {
        const isDateA = /^\d{4}-\d{2}-\d{2}(T|\s)/.test(a);
        const isDateB = /^\d{4}-\d{2}-\d{2}(T|\s)/.test(b);
        if (isDateA && isDateB) {
          return (
            (new Date(a).getTime() - new Date(b).getTime()) * direction
          );
        }
        return a.localeCompare(b) * direction;
      }

      if (typeof a === "number" && typeof b === "number") {
        return (a - b) * direction;
      }

      return String(a).localeCompare(String(b)) * direction;
    };

    return [...payments].sort((a, b) => {
      for (const sort of sorting) {
        const key = sort.id as keyof AdminPaymentResponse;
        const compared = compareValues(
          a[key] as number | string | Date,
          b[key] as number | string | Date,
          sort.desc
        );
        if (compared !== 0) return compared;
      }
      return 0;
    });
  }, [payments, sorting]);

  const updateFilters = useCallback(
    (newFilters: Partial<{
      query: {
        status?: string;
      };
    }>) => {
      const query = newFilters.query || {};
      setSearchParams({
        status: query.status === undefined ? "all" : (query.status || null),
        page: 0, // Reset to first page when filters change
      });
    },
    [setSearchParams]
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updaterOrValue) => {
      setSorting(
        updaterOrValue instanceof Function
          ? updaterOrValue(sorting)
          : updaterOrValue
      );
    },
    [sorting]
  );

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updaterOrValue) => {
      const newPagination =
        updaterOrValue instanceof Function
          ? updaterOrValue(pagination)
          : updaterOrValue;

      setSearchParams({
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      });
    },
    [pagination, setSearchParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({
      status: "all",
      page: 0,
    });
  }, [setSearchParams]);

  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / pagination.pageSize);
  }, [totalCount, pagination.pageSize]);

  return {
    payments: sortedPayments,
    totalCount,
    pageCount,
    filters: {
      query: {
        status:
          (searchParams.status !== "all"
            ? searchParams.status
            : "all") as unknown,
      },
    },
    sorting,
    pagination,
    isLoading,
    error,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
  };
}

