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
import type { WishlistFilterBarProps } from "./types"
import { Badge } from "@/components/ui/badge"

export function WishlistFilterBar({ filters, onFiltersChange, itemCounts }: WishlistFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your wishlist..."
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
              {filters.typeFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={filters.typeFilter}
              onValueChange={(value) => onFiltersChange({ typeFilter: value as any })}
            >
              <DropdownMenuRadioItem value="All">
                All{" "}
                <Badge variant="outline" className="ml-2">
                  {itemCounts.total}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Places">
                Places{" "}
                <Badge variant="outline" className="ml-2">
                  {itemCounts.places}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Experiences">
                Experiences{" "}
                <Badge variant="outline" className="ml-2">
                  {itemCounts.experiences}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Flights">
                Flights{" "}
                <Badge variant="outline" className="ml-2">
                  {itemCounts.flights}
                </Badge>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Boxes">
                Boxes{" "}
                <Badge variant="outline" className="ml-2">
                  {itemCounts.boxes}
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
              <DropdownMenuRadioItem value="dateAdded">Date Added (Newest)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priceHighToLow">Price (High to Low)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priceLowToHigh">Price (Low to High)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
