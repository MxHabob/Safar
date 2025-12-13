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
import type { AdminBookingResponse } from "@/generated/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { BookingActionsDropdown } from "./bookings-actions-dropdown";

interface BookingsTableProps {
  bookings: AdminBookingResponse[];
  totalRows: number;
  sorting: SortingState;
  onSort: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageCount: number;
  isLoading?: boolean;
}

// Date formatting utility
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: "default",
    pending: "secondary",
    cancelled: "destructive",
    completed: "default",
    checked_in: "default",
    checked_out: "default",
    rejected: "destructive",
    refunded: "outline",
  };

  const variant = variantMap[status] || "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

export function BookingsTable({
  bookings,
  totalRows,
  sorting,
  onSort,
  pagination,
  onPaginationChange,
  pageCount,
  isLoading,
}: BookingsTableProps) {
  const columns = useMemo<ColumnDef<AdminBookingResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Booking ID",
        cell: ({ row }) => {
          const id = row.getValue("id") as string;
          return (
            <div className="font-mono text-sm text-muted-foreground">
              {id.slice(0, 8)}...
            </div>
          );
        },
      },
      {
        accessorKey: "guest_id",
        header: "Guest",
        cell: ({ row }) => {
          const guestId = row.getValue("guest_id") as string;
          return (
            <div className="text-sm">
              {guestId.slice(0, 8)}...
            </div>
          );
        },
      },
      {
        accessorKey: "host_id",
        header: "Host",
        cell: ({ row }) => {
          const hostId = row.getValue("host_id") as string;
          return (
            <div className="text-sm">
              {hostId.slice(0, 8)}...
            </div>
          );
        },
      },
      {
        accessorKey: "check_in",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isDesc = column.getIsSorted() === "desc";
                onSort([{ id: "check_in", desc: !isDesc }]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Check In
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
          const date = row.getValue("check_in") as string;
          return <div className="text-sm">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: "check_out",
        header: "Check Out",
        cell: ({ row }) => {
          const date = row.getValue("check_out") as string;
          return <div className="text-sm">{formatDate(date)}</div>;
        },
      },
      {
        accessorKey: "guests",
        header: "Guests",
        cell: ({ row }) => {
          const guests = row.getValue("guests") as number;
          return <div className="text-sm">{guests}</div>;
        },
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const isDesc = column.getIsSorted() === "desc";
                onSort([{ id: "total_amount", desc: !isDesc }]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Total Amount
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
          const amount = row.getValue("total_amount") as number;
          return (
            <div className="font-medium">
              ${amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
          return <BookingActionsDropdown booking={row.original} />;
        },
      },
    ],
    [onSort]
  );

  const table = useReactTable({
    data: bookings,
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
                  No bookings found.
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

