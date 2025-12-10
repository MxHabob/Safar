"use client";

import { usePayments } from "./hooks/use-payments";
import { PaymentsTable } from "./components/payments-table";
import { PaymentsFilters } from "./components/payments-filters";
import { Button } from "@/components/ui/button";
import type { ListPaymentsApiV1AdminPaymentsGetResponse } from "@/generated/schemas";

interface PaymentsPageProps {
  initialPaymentsData?: ListPaymentsApiV1AdminPaymentsGetResponse;
}

export function PaymentsPage({
  initialPaymentsData,
}: PaymentsPageProps = {}) {
  const {
    payments,
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
  } = usePayments({ initialPaymentsData });

  const isEmpty = !isLoading && totalCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform payments ({totalCount.toLocaleString()} total)
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <PaymentsFilters filters={filters} onFiltersChange={updateFilters} />
        </div>
        <div className="p-3">
          <PaymentsTable
            payments={payments}
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
              Error Loading Payments
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load payments. Please try again."}
            </p>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
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

