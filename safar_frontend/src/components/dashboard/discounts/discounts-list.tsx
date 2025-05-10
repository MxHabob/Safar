"use client"

import type { DiscountsListProps } from "./types"
import { DiscountCard } from "./discount-card"

export function DiscountsList({ discounts, showAppliedStatus }: DiscountsListProps) {
  // Group discounts by type for better organization
  const percentageDiscounts = discounts.filter((discount) => discount.discount_type === "Percentage")
  const fixedDiscounts = discounts.filter((discount) => discount.discount_type === "Fixed")

  return (
    <div className="space-y-8">
      {percentageDiscounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Percentage Discounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {percentageDiscounts.map((discount) => (
              <DiscountCard key={discount.id} discount={discount} showAppliedStatus={showAppliedStatus} />
            ))}
          </div>
        </div>
      )}

      {fixedDiscounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Fixed Amount Discounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixedDiscounts.map((discount) => (
              <DiscountCard key={discount.id} discount={discount} showAppliedStatus={showAppliedStatus} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
