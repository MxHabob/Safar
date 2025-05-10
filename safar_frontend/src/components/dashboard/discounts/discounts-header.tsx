"use client"

import { Percent } from "lucide-react"
import type { DiscountsHeaderProps } from "./types"

export function DiscountsHeader({ discountCounts, activeTab }: DiscountsHeaderProps) {
  const title = activeTab === "available" ? "Available Discounts" : "My Discounts"
  const description =
    activeTab === "available"
      ? `Explore ${discountCounts.total} available discount${discountCounts.total !== 1 ? "s" : ""} for your next adventure`
      : `You have ${discountCounts.total} saved discount${discountCounts.total !== 1 ? "s" : ""}`

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Percent className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}
