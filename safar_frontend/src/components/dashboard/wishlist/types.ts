import type { Wishlist } from "@/core/types"

export type WishlistItemType = "All" | "Places" | "Experiences" | "Flights" | "Boxes"
export type SortOption = "dateAdded" | "priceHighToLow" | "priceLowToHigh"

export interface WishlistFilters {
  searchQuery: string
  typeFilter: WishlistItemType
  sortBy: SortOption
}

export interface ItemCounts {
  places: number
  experiences: number
  flights: number
  boxes: number
  total: number
}

export interface WishlistHeaderProps {
  itemCounts: ItemCounts
}

export interface WishlistFilterBarProps {
  filters: WishlistFilters
  onFiltersChange: (newFilters: Partial<WishlistFilters>) => void
  itemCounts: ItemCounts
}

export interface WishlistItemsProps {
  wishlistItems: Wishlist[]
  onRemoveFromWishlist: (id: string) => void
}

export interface WishlistEmptyStateProps {
  hasItems: boolean
  activeFilter: WishlistItemType
}

export interface WishlistItemProps {
  item: Wishlist
  onRemoveFromWishlist: () => void
}
