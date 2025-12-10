"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/shared/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import { ListUsersApiV1AdminUsersGetParams, UserStatus, UserStatusSchema } from "@/generated/schemas";

interface UsersFiltersProps {
  filters: ListUsersApiV1AdminUsersGetParams;
  onFiltersChange: (filters: Partial<ListUsersApiV1AdminUsersGetParams>) => void;
}

export function UsersFilters({
  filters,
  onFiltersChange,
}: UsersFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search customers..."
          value={filters.query?.search ?? ""}
          onChange={(e) =>
            onFiltersChange({
              query: { ...filters.query, search: e.target.value || undefined },
            })
          }
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <Select
          value={(filters.query?.status as string | undefined) ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              query: {
                ...filters.query,
                status: value === "all" ? undefined : (value as UserStatus),
              },
            })
          }
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {["all", ...UserStatusSchema.options].map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePickerWithRange
          className="w-full md:w-auto"
          date={{
            from: filters.query?.date_join_start
              ? new Date(filters.query.date_join_start as unknown as string)
              : undefined,
            to: filters.query?.date_join_end
              ? new Date(filters.query.date_join_end as unknown as string)
              : undefined,
          }}
          onDateChange={(dateRange: DateRange | undefined) =>
            onFiltersChange({
              query: {
                ...filters.query,
                date_join_start: dateRange?.from ?? undefined,
                date_join_end: dateRange?.to ?? undefined,
              },
            })
          }
        />
      </div>
    </div>
  );
} 