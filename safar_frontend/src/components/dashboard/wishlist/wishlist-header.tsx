"use client"
import type { WishlistHeaderProps } from "./types"

export function WishlistHeader({ itemCounts }: WishlistHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <p className="text-muted-foreground mt-1">
          You have {itemCounts.total} saved {itemCounts.total === 1 ? "item" : "items"}
        </p>
      </div>
    </div>
  )
}
