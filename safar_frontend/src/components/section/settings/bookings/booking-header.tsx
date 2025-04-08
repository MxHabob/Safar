"use client"

import { useState } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,

  Filter,
  Search,
  SlidersHorizontal,

} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


type BookingType = "All" | "Place" | "Experience" | "Flight" | "Box"
type BookingStatus = "All" | "Pending" | "Confirmed" | "Cancelled"
type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "date-near" | "date-far"

export const  BookingHeader = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<BookingType>("All")
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("All")
  const [sortOption, setSortOption] = useState<SortOption>("newest")






  return (
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Type: {typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={typeFilter} onValueChange={(value) => setTypeFilter(value as BookingType)}>
                <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Place">Places</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Experience">Experiences</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Flight">Flights</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Box">Packages</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as BookingStatus)}
              >
                <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Confirmed">Confirmed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Cancelled">Cancelled</DropdownMenuRadioItem>
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
              <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <DropdownMenuRadioItem value="newest">
                  <ArrowUpAZ className="h-4 w-4 mr-2" />
                  Newest first
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">
                  <ArrowDownAZ className="h-4 w-4 mr-2" />
                  Oldest first
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="price-high">Price: High to low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-low">Price: Low to high</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="date-near">Date: Soonest first</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date-far">Date: Latest first</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
)}