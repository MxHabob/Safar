/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DiscountsFilterBarProps } from "./types"
import { Badge } from "@/components/ui/badge"

export function DiscountsFilterBar({ filters, onFiltersChange, discountCounts }: DiscountsFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discounts by code or description..."
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
              {filters.discountType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={filters.discountType}
              onValueChange={(value) => onFiltersChange({ discountType: value as any })}
            >
              <DropdownMenuRadioItem value="All">
                All{" "}
                <Badge variant="outline" className="ml-2">
                  {discountCounts.total}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Percentage">
                Percentage{" "}
                <Badge variant="outline" className="ml-2">
                  {discountCounts.percentage}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Fixed">
                Fixed Amount{" "}
                <Badge variant="outline" className="ml-2">
                  {discountCounts.fixed}
                </Badge>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={filters.sortBy}
              onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
            >
              <DropdownMenuRadioItem value="expiryDate">Expiring Soon</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="highestValue">Highest Value</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
