"use client"

import { useState } from "react"
import { useGetWishlistsQuery, useRemoveFromWishlistMutation } from "@/core/services/api"
import type { WishlistFilters } from "./types"
import { WishlistHeader } from "./wishlist-header"
import { WishlistFilterBar } from "./wishlist-filter-bar"
import { WishlistItems } from "./wishlist-items"
import { WishlistEmptyState } from "./wishlist-empty-state"
import { Spinner } from "@/components/ui/spinner"

export const WishlistPageContent = () => {
  const { data: wishlistData, isLoading, refetch } = useGetWishlistsQuery({})
  const wishlistItems = wishlistData?.results || []
  const [removeFromWishlist] = useRemoveFromWishlistMutation()

  const [filters, setFilters] = useState<WishlistFilters>({
    searchQuery: "",
    typeFilter: "All",
    sortBy: "dateAdded",
  })

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await removeFromWishlist(id).unwrap()
      refetch()
    } catch (error) {
      console.error("Failed to remove item from wishlist:", error)
    }
  }

  const handleFiltersChange = (newFilters: Partial<WishlistFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const filteredWishlistItems = wishlistItems.filter((item) => {
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      const nameField = item.place?.name || item.experience?.title || item.flight?.flight_number || item.box?.name || ""

      if (!nameField.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    if (filters.typeFilter !== "All") {
      if (filters.typeFilter === "Places" && !item.place) return false
      if (filters.typeFilter === "Experiences" && !item.experience) return false
      if (filters.typeFilter === "Flights" && !item.flight) return false
      if (filters.typeFilter === "Boxes" && !item.box) return false
    }

    return true
  })

  const sortedWishlistItems = [...filteredWishlistItems].sort((a, b) => {
    if (filters.sortBy === "dateAdded") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (filters.sortBy === "priceHighToLow") {
      const priceA = a.place?.price || a.experience?.price_per_person || a.flight?.price || a.box?.total_price || 0
      const priceB = b.place?.price || b.experience?.price_per_person || b.flight?.price || b.box?.total_price || 0
      return priceB - priceA
    } else if (filters.sortBy === "priceLowToHigh") {
      const priceA = a.place?.price || a.experience?.price_per_person || a.flight?.price || a.box?.total_price || 0
      const priceB = b.place?.price || b.experience?.price_per_person || b.flight?.price || b.box?.total_price || 0
      return priceA - priceB
    }
    return 0
  })
  const itemCounts = {
    places: wishlistData?.count || 0,
    experiences: wishlistData?.count || 0,
    flights: wishlistData?.count  || 0,
    boxes: wishlistData?.count  || 0,
    total: wishlistData?.count  || 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WishlistHeader itemCounts={itemCounts} />

      <WishlistFilterBar filters={filters} onFiltersChange={handleFiltersChange} itemCounts={itemCounts} />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size={"lg"}/>
        </div>
      ) : sortedWishlistItems.length > 0 ? (
        <WishlistItems wishlistItems={sortedWishlistItems} onRemoveFromWishlist={handleRemoveFromWishlist} />
      ) : (
        <WishlistEmptyState hasItems={itemCounts.total > 0} activeFilter={filters.typeFilter} />
      )}
    </div>
  )
}
