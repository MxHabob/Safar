"use client"

import { Percent, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { DiscountsEmptyStateProps } from "./types"

export function DiscountsEmptyState({ hasDiscounts, activeFilter, type }: DiscountsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {hasDiscounts ? (
        <>
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No matching discounts found</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn&apos;t find any {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} discounts matching your
            current filters. Try adjusting your search or filters to see more discounts.
          </p>
        </>
      ) : (
        <>
          <Percent className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            {type === "available" ? "No available discounts" : "You don't have any discounts yet"}
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            {type === "available"
              ? "There are no active discounts available at the moment. Check back later for new offers!"
              : "Complete bookings and explore our offers to receive discounts for your next adventure."}
          </p>
          {type === "my-discounts" && (
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/places">
                <Button>Explore Places</Button>
              </Link>
              <Link href="/experiences">
                <Button variant="outline">Discover Experiences</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
