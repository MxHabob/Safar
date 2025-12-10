"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ListingsFiltersProps {
  filters: {
    query: {
      search?: string;
      status?: string;
    };
  };
  onFiltersChange: (filters: {
    query: {
      search?: string;
      status?: string;
    };
  }) => void;
}

export function ListingsFilters({
  filters,
  onFiltersChange,
}: ListingsFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.query.search || "");

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({
      query: {
        ...filters.query,
        search: localSearch || undefined,
      },
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      query: {
        ...filters.query,
        status: value !== "all" ? value : undefined,
      },
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    onFiltersChange({
      query: {
        search: undefined,
        status: undefined,
      },
    });
  };

  const hasActiveFilters =
    filters.query.search || filters.query.status !== "all";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title, city, country..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearchSubmit} size="default">
            Search
          </Button>
        </div>
      </div>

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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={handleClear}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

