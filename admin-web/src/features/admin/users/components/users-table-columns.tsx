"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { UserActionsDropdown } from "./users-actions-dropdown";
import { User, UserStatus } from "@/generated/schemas";

export const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
};

// Use formatCurrency from utils instead of local function

export const useUserColumns = () => {
  return useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "id",
        header: "User ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "full_name",
        header: "Contact",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.getValue("full_name")}</span>
            <span className="text-sm text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => <div>{row.getValue("company")}</div>,
      },
      {
        accessorKey: "created_at",
        header: "Date Joined",
        cell: ({ row }) => format(new Date(row.getValue("created_at")), "PP"),
      },
      {
        accessorKey: "last_login",
        header: "Last Login",
        cell: ({ row }) => {
          const value = row.getValue("last_login") as string | null | undefined;
          return value ? format(new Date(value), "PP p") : "Never";
        },
      },
      {
        accessorKey: "api_quota",
        header: "API Quota",
        cell: ({ row }) => {
          const apiQuota = row.getValue("api_quota") as number;
          return typeof apiQuota === "number" ? apiQuota.toLocaleString() : "-";
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
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