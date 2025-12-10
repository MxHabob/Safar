"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BookingsFiltersProps {
  filters: {
    query: {
      status?: string;
    };
  };
  onFiltersChange: (filters: {
    query: {
      status?: string;
    };
  }) => void;
}

export function BookingsFilters({
  filters,
  onFiltersChange,
}: BookingsFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      query: {
        status: value !== "all" ? value : undefined,
      },
    });
  };

  const handleClear = () => {
    onFiltersChange({
      query: {
        status: undefined,
      },
    });
  };

  const hasActiveFilters = filters.query.status !== "all";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.query.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger id="status" className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClear} className="gap-2">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

