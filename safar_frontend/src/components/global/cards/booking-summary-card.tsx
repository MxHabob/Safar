"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { RareFindBanner } from "./notification-banner"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContainer } from "@/components/ui/card-container"

interface PriceBreakdownItem {
  label: string
  amount: number
  type?: "regular" | "discount" | "fee" | "total"
  tooltip?: string
}

interface BookingSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  originalPrice: number
  discountedPrice?: number
  currency?: string
  checkInDate?: Date
  checkOutDate?: Date
  guests: number
  maxGuests?: number
  priceBreakdown: PriceBreakdownItem[]
  onReserve?: () => void
  isRareFind?: boolean
}

export function BookingSummaryCard({
  originalPrice,
  discountedPrice,
  currency = "$",
  checkInDate = new Date("2025-04-23"),
  checkOutDate = new Date("2025-04-23"),
  guests,
  priceBreakdown,
  onReserve,
  isRareFind = false,
  className,
  ...props
}: BookingSummaryCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("$", currency)
  }

  const getNights = () => {
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const nights = getNights()

  return (
    <CardContainer variant="elevated" className={cn("overflow-hidden", className)} {...props}>
      {isRareFind && (
        <div className="mb-4">
          <RareFindBanner />
        </div>
      )}

      <div className="p-6 space-y-4">
        <div className="flex items-baseline gap-2">
          {discountedPrice ? (
            <>
              <span className="text-2xl font-bold">
                {currency}
                {discountedPrice}
              </span>
              <span className="text-lg text-slate-500 line-through">
                {currency}
                {originalPrice}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold">
              {currency}
              {originalPrice}
            </span>
          )}
          <span className="text-slate-600">night</span>
        </div>

        <div className="grid grid-cols-2 rounded-lg overflow-hidden">
          <div className="p-3 border-r border-b ">
            <div className="text-xs font-semibold uppercase text-slate-600">CHECK-IN</div>
            <div>{formatDate(checkInDate)}</div>
          </div>
          <div className="p-3 ">
            <div className="text-xs font-semibold uppercase text-slate-600">CHECKOUT</div>
            <div>{formatDate(checkOutDate)}</div>
          </div>
          <div className="p-3 col-span-2 flex justify-between items-center">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-600">GUESTS</div>
              <div>
                {guests} {guests === 1 ? "guest" : "guests"}
              </div>
            </div>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>

        <Button
          className="w-full bg-brand-600 hover:bg-brand-700 py-6 rounded-lg text-base font-medium"
          onClick={onReserve}
        >
          Reserve
        </Button>

        <div className="text-center text-sm text-slate-600">You won&apos;t be charged yet</div>

        <div className="space-y-3 pt-3 ">
          {priceBreakdown.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div
                className={cn(
                  "text-slate-800",
                  item.type === "total" && "font-semibold",
                  item.tooltip && "underline decoration-dotted underline-offset-4 cursor-help",
                )}
              >
                {item.label}
              </div>
              <div
                className={cn(item.type === "discount" && "text-green-600", item.type === "total" && "font-semibold")}
              >
                {item.type === "discount" ? "-" : ""}
                {formatCurrency(Math.abs(item.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContainer>
  )
}

