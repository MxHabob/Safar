"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useUsers } from "./hooks/use-users";
import { UsersTable } from "./components/users-table";
import { UsersFilters } from "./components/users-filters";
import { Button } from "@/components/ui/button";
import { ListUsersApiV1AdminUsersGetResponse } from "@/generated/schemas";

interface UserPageProps {
  initialUsersData?: ListUsersApiV1AdminUsersGetResponse
}

export function UserPage({ initialUsersData }: UserPageProps = {}) {
  const {
    users,
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
  } = useUsers({ initialUsersData });

  const isEmpty = !isLoading && totalCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-4">
          <Link href="/ai/admin/users/new">
            <Button>
              <Plus className="size-4" />
              New User
            </Button>
          </Link>
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <UsersFilters filters={filters} onFiltersChange={updateFilters} />
        </div>
        <div className="p-3">
          <UsersTable
            users={users}
            totalRows={totalCount}
            sorting={sorting}
            onSort={handleSortingChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            pageCount={pageCount}
          />
        </div>
      </div>

      {error && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold text-destructive">Error Loading Users</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {error.message || "Failed to load users. Please try again."}
            </p>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
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