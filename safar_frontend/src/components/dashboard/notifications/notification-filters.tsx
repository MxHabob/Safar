"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { NotificationsFilters } from "./types";


interface NotificationFiltersProps {
  filters: NotificationsFilters;
  onFiltersChange: (newFilters: Partial<NotificationsFilters>) => void;
}

export function NotificationFilters({ filters, onFiltersChange }: NotificationFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          className="pl-9"
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Type: {filters.typeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem 
              checked={filters.typeFilter === "All"} 
              onCheckedChange={() => onFiltersChange({ typeFilter: "All" })}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.typeFilter === "Booking Update"}
              onCheckedChange={() => onFiltersChange({ typeFilter: "Booking Update" })}
            >
              Booking Updates
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.typeFilter === "Payment"}
              onCheckedChange={() => onFiltersChange({ typeFilter: "Payment" })}
            >
              Payments
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.typeFilter === "Discount"}
              onCheckedChange={() => onFiltersChange({ typeFilter: "Discount" })}
            >
              Discounts
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.typeFilter === "Message"}
              onCheckedChange={() => onFiltersChange({ typeFilter: "Message" })}
            >
              Messages
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.typeFilter === "General"}
              onCheckedChange={() => onFiltersChange({ typeFilter: "General" })}
            >
              General
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Status: {filters.readFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem 
              checked={filters.readFilter === "All"} 
              onCheckedChange={() => onFiltersChange({ readFilter: "All" })}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={filters.readFilter === "Read"} 
              onCheckedChange={() => onFiltersChange({ readFilter: "Read" })}
            >
              Read
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.readFilter === "Unread"}
              onCheckedChange={() => onFiltersChange({ readFilter: "Unread" })}
            >
              Unread
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}