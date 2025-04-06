import type React from "react"
import { cn } from "@/lib/utils"
import { Award } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"

interface GuestFavoriteBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number
  reviewCount: number
  compact?: boolean
}

export function GuestFavoriteBadge({
  rating,
  reviewCount,
  compact = false,
  className,
  ...props
}: GuestFavoriteBadgeProps) {
  return (
    <CardContainer
      variant="glass"
      className={cn(
        "flex items-center justify-between gap-4 py-4 px-5 hover:shadow-medium transition-all duration-300",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br  shadow-md">
          <Award className="h-5 w-5" />
        </div>

        {compact ? (
          <span className="font-semibold ">Guest favorite</span>
        ) : (
          <div>
            <span className="font-semibold">Guest favorite</span>
            <p className="text-sm mt-0.5">One of the most loved homes on Safar, according to guests</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="text-xl font-bold">{rating}</div>
        <div className="text-sm font-medium hover:text-slate-900 hover:underline transition-colors">
          {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
        </div>
      </div>
    </CardContainer>
  )
}

