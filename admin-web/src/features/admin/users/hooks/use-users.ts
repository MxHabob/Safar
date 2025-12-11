import { useMemo, useCallback, useState } from "react";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import { useListUsersApiV1AdminUsersGet } from "@/generated/hooks/admin";
import { ListUsersApiV1AdminUsersGetResponse, AdminUserResponse } from "@/generated/schemas";

const searchParamsConfig = {
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault("all"),
  role: parseAsString.withDefault(""),
  date_join_start: parseAsString.withDefault(""),
  date_join_end: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
};

interface UseUsersProps {
  initialUsersData?: ListUsersApiV1AdminUsersGetResponse
}

export function useUsers({ initialUsersData }: UseUsersProps = {}) {
  // Use nuqs for URL state management - better performance and type safety
  const [searchParams, setSearchParams] = useQueryStates(searchParamsConfig, {
    history: "push",
    shallow: false,
  });

  // Extract filters from URL params
  const filters = useMemo(() => ({
    query: {
      search: searchParams.search || undefined,
      status: searchParams.status !== "all" ? searchParams.status : undefined,
      role: searchParams.role || undefined,
    },
  }), [searchParams]);

  // Convert URL pagination to component state
  const pagination: PaginationState = useMemo(() => ({
    pageIndex: searchParams.page,
    pageSize: searchParams.pageSize,
  }), [searchParams.page, searchParams.pageSize]);

  // Default sorting - can be extended to use URL params if needed
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateJoined", desc: true },
  ]);

  // Check if we should use initial data (only when no filters are applied and on first page)
  const shouldUseInitialData = 
    !filters.query.search && 
    filters.query.status === undefined && 
    !filters.query.role && 
    pagination.pageIndex === 0;

  // Fetch users from API with filters - API handles filtering and pagination
  // Use initialData from server for faster initial load when no filters are applied
  const { data, isLoading, error } = useListUsersApiV1AdminUsersGet(
    pagination.pageIndex * pagination.pageSize, // skip
    pagination.pageSize, // limit
    filters.query.role, // role
    filters.query.status, // status
    filters.query.search, // search
    {
      enabled: true,
      // refetchOnWindowFocus: false,
      // Use initial data only when no filters are applied (matches server fetch)
      initialData: shouldUseInitialData ? initialUsersData : undefined,
    }
  );

  // Extract users from API response
  // API returns AdminUserListResponse with items array and total count
  const users = Array.isArray(data?.items) ? data.items : [];
  const totalCount = data?.total ?? 0;

  // Apply client-side sorting (API should handle this, but keeping for now)
  const sortedUsers = useMemo(() => {
    if (!users || users.length === 0 || sorting.length === 0) return users;

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
          return (new Date(a).getTime() - new Date(b).getTime()) * direction;
        }
        return a.localeCompare(b) * direction;
      }

      if (typeof a === "number" && typeof b === "number") {
        return (a - b) * direction;
      }

      return String(a).localeCompare(String(b)) * direction;
    };

    return [...users].sort((a, b) => {
      for (const sort of sorting) {
        const key = sort.id as keyof AdminUserResponse;
        const compared = compareValues(a[key], b[key], sort.desc);
        if (compared !== 0) return compared;
      }
      return 0;
    });
  }, [users, sorting]);

  const updateFilters = useCallback((newFilters: Partial<{
    query: {
      search?: string;
      status?: string;
      role?: string;
    };
  }>) => {
    const query = newFilters.query || {};
    setSearchParams({
      search: query.search || null,
      status: query.status === undefined ? "all" : (query.status || null),
      role: query.role || null,
      page: 0, // Reset to first page when filters change
    });
  }, [setSearchParams]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback((updaterOrValue) => {
    setSorting(
      updaterOrValue instanceof Function
        ? updaterOrValue(sorting)
        : updaterOrValue
    );
  }, [sorting]);

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback((
    updaterOrValue
  ) => {
    const newPagination = updaterOrValue instanceof Function
      ? updaterOrValue(pagination)
      : updaterOrValue;
    
    setSearchParams({
      page: newPagination.pageIndex,
      pageSize: newPagination.pageSize,
    });
  }, [pagination, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setSearchParams({
      search: null,
      status: "all",
      role: null,
      page: 0,
    });
  }, [setSearchParams]);

  // Calculate page count - ideally API should return total count
  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / pagination.pageSize);
  }, [totalCount, pagination.pageSize]);

  return {
    // Users with sorting applied (API handles filtering and pagination)
    users: sortedUsers,
    // Total count for pagination
    totalCount,
    pageCount,
    // States - match the format expected by UsersFilters component
    filters: {
      query: {
        search: searchParams.search || undefined,
        status: (searchParams.status !== "all" ? searchParams.status : "all") as unknown,
        role: searchParams.role || undefined,
      },
    },
    sorting,
    pagination,
    // Loading and error states
    isLoading,
    error,
    // Update handlers
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
  };
} 