import type React from "react"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

interface RatingDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number
  reviewCount?: number
  showReviewLink?: boolean
  size?: "sm" | "md" | "lg"
  starColor?: string
  variant?: "default" | "modern" | "minimal"
}

export function RatingDisplay({
  rating,
  reviewCount,
  showReviewLink = false,
  size = "md",
  starColor = "text-amber-400",
  variant = "default",
  className,
  ...props
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-medium",
  }

  const renderStars = () => {
    if (variant === "minimal") {
      return <Star className={cn("h-4 w-4 fill-current", starColor)} />
    }

    if (variant === "modern") {
      return (
        <div className="relative inline-flex items-center">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn("h-3.5 w-3.5 text-slate-200", size === "lg" && "h-4 w-4")}
                fill="currentColor"
              />
            ))}
          </div>
          <div className="absolute top-0 left-0 flex overflow-hidden" style={{ width: `${(rating / 5) * 100}%` }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn("h-3.5 w-3.5", starColor, size === "lg" && "h-4 w-4")}
                fill="currentColor"
              />
            ))}
          </div>
        </div>
      )
    }

    return <Star className={cn("h-4 w-4 fill-current", starColor)} />
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <div className={cn("flex items-center", sizeClasses[size])}>
        <span className="font-medium">{rating.toFixed(2)}</span>
        <span className="ml-1.5">{renderStars()}</span>
      </div>

      {reviewCount !== undefined && (
        <>
          {showReviewLink ? (
            <a
              href="#reviews"
              className={cn(" hover:underline transition-colors", sizeClasses[size])}
            >
              {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
            </a>
          ) : (
            <span className={cn("text-slate-600", sizeClasses[size])}>
              {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
            </span>
          )}
        </>
      )}
    </div>
  )
}

