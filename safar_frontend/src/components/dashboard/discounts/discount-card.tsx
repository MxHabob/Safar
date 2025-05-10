"use client"

import { useState } from "react"
import { Copy, Check, Percent, CreditCard, Calendar } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CountdownTimer } from "./countdown-timer"
import type { DiscountCardProps } from "./types"

export function DiscountCard({ discount, showAppliedStatus }: DiscountCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(discount.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isExpired = new Date(discount.valid_to) < new Date()
  const isExpiringSoon =
    !isExpired && new Date(discount.valid_to).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isExpired ? "opacity-60" : ""}`}>
      <div className="relative p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <Badge
              className={
                discount.discount_type === "Percentage"
                  ? "bg-violet-500 hover:bg-violet-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }
            >
              {discount.discount_type === "Percentage" ? "Percentage" : "Fixed Amount"}
            </Badge>

            {isExpired && (
              <Badge variant="destructive" className="ml-2">
                Expired
              </Badge>
            )}

            {isExpiringSoon && !isExpired && (
              <Badge variant="outline" className="ml-2 border-amber-500 text-amber-500">
                Expiring Soon
              </Badge>
            )}
          </div>

          {discount.discount_type === "Percentage" ? (
            <div className="flex items-center text-violet-500">
              <Percent className="h-5 w-5 mr-1" />
            </div>
          ) : (
            <div className="flex items-center text-emerald-500">
              <CreditCard className="h-5 w-5 mr-1" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-bold">
            {discount.discount_type === "Percentage" ? `${discount.amount}% OFF` : `${discount.amount} OFF`}
          </h3>
          {discount.discount_type && <p className="text-muted-foreground mt-2">{discount.discount_type}</p>}
        </div>

        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Valid until {formatDate(discount.valid_to)}</span>
        </div>

        {!isExpired && (
          <div className="mt-2">
            <CountdownTimer expiryDate={discount.valid_to} />
          </div>
        )}
      </div>

      <CardContent className="p-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Discount Code</p>
            <div className="flex items-center">
              <code className="bg-muted px-2 py-1 rounded text-lg font-mono">{discount.code}</code>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={isExpired}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy code"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex justify-between">
        {showAppliedStatus && discount.applicable_places && discount.applicable_places.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Applied to {discount.applicable_places.length}{" "}
            {discount.applicable_places.length === 1 ? "place" : "places"}
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
