"use client"

import { Heart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { WishlistEmptyStateProps } from "./types"

export function WishlistEmptyState({ hasItems, activeFilter }: WishlistEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {hasItems ? (
        <>
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No matching items found</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn&apos;t find any {activeFilter !== "All" ? activeFilter.toLowerCase() : "items"} matching your current
            filters. Try adjusting your search or filters to see more items.
          </p>
        </>
      ) : (
        <>
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Save places, experiences, flights, and travel boxes to your wishlist to easily find them later.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/places">
              <Button>Explore Places</Button>
            </Link>
            <Link href="/experiences">
              <Button variant="outline">Discover Experiences</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
