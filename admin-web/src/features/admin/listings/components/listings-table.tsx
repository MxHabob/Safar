"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/shared/data-pagination";
import type { AdminListingResponse } from "@/generated/schemas";
// Date formatting utility
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingActionsDropdown } from "./listings-actions-dropdown";

interface ListingsTableProps {
  listings: AdminListingResponse[];
  totalRows: number;
  sorting: SortingState;
  onSort: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageCount: number;
  isLoading?: boolean;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "default"
      : status === "pending"
      ? "secondary"
      : status === "suspended"
      ? "destructive"
      : "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function ListingsTable({
  listings,
  totalRows,
  sorting,
  onSort,
  pagination,
  onPaginationChange,
  pageCount,
  isLoading,
}: ListingsTableProps) {
  const columns = useMemo<ColumnDef<AdminListingResponse>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isDesc = column.getIsSorted() === "desc";
                onSort([{ id: "title", desc: !isDesc }]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Title
              {column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="max-w-[200px] truncate font-medium">
              {row.getValue("title")}
            </div>
          );
        },
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ row }) => {
          const city = row.getValue("city") as string | null;
          const country = row.original.country;
          return (
            <div className="text-sm">
              {city && country ? `${city}, ${country}` : "N/A"}
            </div>
          );
        },
      },
      {
        accessorKey: "price_per_night",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isDesc = column.getIsSorted() === "desc";
                onSort([{ id: "price_per_night", desc: !isDesc }]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Price/Night
              {column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const price = row.getValue("price_per_night") as number;
          return (
            <div className="font-medium">
              ${price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => {
          const rating = row.getValue("rating") as number | null;
          const reviewCount = row.original.review_count || 0;
          return (
            <div className="text-sm">
              {rating ? (
                <span>
                  {rating.toFixed(1)} ({reviewCount} reviews)
                </span>
              ) : (
                <span className="text-muted-foreground">No ratings</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return <StatusBadge status={status} />;
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isDesc = column.getIsSorted() === "desc";
                onSort([{ id: "created_at", desc: !isDesc }]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Created
              {column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return (
            <div className="text-sm text-muted-foreground">
              {formatDate(date)}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          return <ListingActionsDropdown listing={row.original} />;
        },
      },
    ],
    [onSort]
  );

  const table = useReactTable({
    data: listings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: onSort,
    onPaginationChange,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No listings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataPagination
        page={pagination.pageIndex + 1}
        totalPages={pageCount}
        onPageChange={(page) => {
          onPaginationChange({
            ...pagination,
            pageIndex: page - 1,
          });
        }}
      />
    </div>
  );
}

