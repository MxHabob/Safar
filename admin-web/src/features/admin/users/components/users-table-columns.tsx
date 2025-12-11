"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { UserActionsDropdown } from "./users-actions-dropdown";
import { AdminUserResponse, UserStatus } from "@/generated/schemas";

export const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending_verification: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
};

// Use formatCurrency from utils instead of local function

export const useUserColumns = () => {
  return useMemo<ColumnDef<AdminUserResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "User ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>
              {row.original.first_name && row.original.last_name
                ? `${row.original.first_name} ${row.original.last_name}`
                : row.original.username || row.original.email}
            </span>
            <span className="text-sm text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Date Joined",
        cell: ({ row }) => format(new Date(row.getValue("created_at")), "PP"),
      },
      {
        accessorKey: "last_login_at",
        header: "Last Login",
        cell: ({ row }) => {
          const value = row.original.last_login_at as string | null | undefined;
          return value ? format(new Date(value), "PP p") : "Never";
        },
      },
      {
        accessorKey: "booking_count",
        header: "Bookings",
        cell: ({ row }) => {
          const count = row.original.booking_count as number | null | undefined;
          return typeof count === "number" ? count.toLocaleString() : "0";
        },
      },
      {
        accessorKey: "listing_count",
        header: "Listings",
        cell: ({ row }) => {
          const count = row.original.listing_count as number | null | undefined;
          return typeof count === "number" ? count.toLocaleString() : "0";
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as UserStatus;
          return (
            <Badge className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <UserActionsDropdown user={row.original} />,
      },
    ],
    []
  );
}; 