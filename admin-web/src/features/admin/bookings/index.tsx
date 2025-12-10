"use client";

import { useBookings } from "./hooks/use-bookings";
import { BookingsTable } from "./components/bookings-table";
import { BookingsFilters } from "./components/bookings-filters";
import { Button } from "@/components/ui/button";
import type { ListBookingsApiV1AdminBookingsGetResponse } from "@/generated/schemas";

interface BookingsPageProps {
  initialBookingsData?: ListBookingsApiV1AdminBookingsGetResponse;
}

export function BookingsPage({
  initialBookingsData,
}: BookingsPageProps = {}) {
  const {
    bookings,
    totalCount,
    pageCount,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    isLoading,
    error,
  } = useBookings({ initialBookingsData });

  const isEmpty = !isLoading && totalCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform bookings ({totalCount.toLocaleString()} total)
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <BookingsFilters filters={filters} onFiltersChange={updateFilters} />
        </div>
        <div className="p-3">
          <BookingsTable
            bookings={bookings}
            totalRows={totalCount}
            sorting={sorting}
            onSort={handleSortingChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            pageCount={pageCount}
            isLoading={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold text-destructive">
              Error Loading Bookings
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load bookings. Please try again."}
            </p>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Try adjusting your filter to find what you are looking for.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

