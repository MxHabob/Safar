import type { Discount } from "@/core/types"

export type DiscountTypeFilter = "All" | "Percentage" | "Fixed"
export type SortOption = "expiryDate" | "highestValue" | "newest"

export interface DiscountFilters {
  searchQuery: string
  discountType: DiscountTypeFilter
  sortBy: SortOption
}

export interface DiscountCounts {
  percentage: number
  fixed: number
  total: number
}

export interface DiscountsHeaderProps {
  discountCounts: DiscountCounts
  activeTab: "available" | "my-discounts"
}

export interface DiscountsFilterBarProps {
  filters: DiscountFilters
  onFiltersChange: (newFilters: Partial<DiscountFilters>) => void
  discountCounts: DiscountCounts
}

export interface DiscountsListProps {
  discounts: Discount[]
  showAppliedStatus: boolean
}

export interface DiscountsEmptyStateProps {
  hasDiscounts: boolean
  activeFilter: DiscountTypeFilter
  type: "available" | "my-discounts"
}

export interface DiscountCardProps {
  discount: Discount
  showAppliedStatus: boolean
}

export interface CountdownTimerProps {
  expiryDate: string
}
