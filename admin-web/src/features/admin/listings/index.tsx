"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useListings } from "./hooks/use-listings";
import { ListingsTable } from "./components/listings-table";
import { ListingsFilters } from "./components/listings-filters";
import { Button } from "@/components/ui/button";
import type { ListListingsApiV1AdminListingsGetResponse } from "@/generated/schemas";

interface ListingsPageProps {
  initialListingsData?: ListListingsApiV1AdminListingsGetResponse;
}

export function ListingsPage({
  initialListingsData,
}: ListingsPageProps = {}) {
  const {
    listings,
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
  } = useListings({ initialListingsData });

  const isEmpty = !isLoading && totalCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform listings ({totalCount.toLocaleString()} total)
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <ListingsFilters
            filters={filters}
            onFiltersChange={updateFilters}
          />
        </div>
        <div className="p-3">
          <ListingsTable
            listings={listings}
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
              Error Loading Listings
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load listings. Please try again."}
            </p>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filter to find what you are looking
              for.
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

