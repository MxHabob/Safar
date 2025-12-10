"use client";

import { useMemo, useCallback, useState } from "react";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import { useListListingsApiV1AdminListingsGet } from "@/generated/hooks/admin";
import type { ListListingsApiV1AdminListingsGetResponse, AdminListingResponse } from "@/generated/schemas";

const searchParamsConfig = {
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(50), // Larger default for big data
};

interface UseListingsProps {
  initialListingsData?: ListListingsApiV1AdminListingsGetResponse;
}

export function useListings({ initialListingsData }: UseListingsProps = {}) {
  // Use nuqs for URL state management - better performance and type safety
  const [searchParams, setSearchParams] = useQueryStates(searchParamsConfig, {
    history: "push",
    shallow: false,
  });

  // Extract filters from URL params
  const filters = useMemo(
    () => ({
      query: {
        search: searchParams.search || undefined,
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
    !filters.query.search &&
    filters.query.status === undefined &&
    pagination.pageIndex === 0;

  // Fetch listings from API with filters - API handles filtering and pagination
  const { data, isLoading, error } = useListListingsApiV1AdminListingsGet(
    pagination.pageIndex * pagination.pageSize, // skip
    pagination.pageSize, // limit
    filters.query.status, // status
    filters.query.search, // search
    {
      enabled: true,
      initialData: shouldUseInitialData ? initialListingsData : undefined,
    }
  );

  // Extract listings from API response
  const listings = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data.items) ? data.items : [];
  }, [data]);

  const totalCount = data?.total || 0;

  // Apply client-side sorting (API should handle this, but keeping for now)
  const sortedListings = useMemo(() => {
    if (!listings || listings.length === 0 || sorting.length === 0)
      return listings;

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

    return [...listings].sort((a, b) => {
      for (const sort of sorting) {
        const key = sort.id as keyof AdminListingResponse;
        const compared = compareValues(
          a[key] as number | string | Date,
          b[key] as number | string | Date,
          sort.desc
        );
        if (compared !== 0) return compared;
      }
      return 0;
    });
  }, [listings, sorting]);

  const updateFilters = useCallback(
    (newFilters: Partial<{
      query: {
        search?: string;
        status?: string;
      };
    }>) => {
      const query = newFilters.query || {};
      setSearchParams({
        search: query.search || null,
        status:
          query.status === undefined ? "all" : (query.status || null),
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
      search: null,
      status: "all",
      page: 0,
    });
  }, [setSearchParams]);

  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / pagination.pageSize);
  }, [totalCount, pagination.pageSize]);

  return {
    listings: sortedListings,
    totalCount,
    pageCount,
    filters: {
      query: {
        search: searchParams.search || undefined,
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

