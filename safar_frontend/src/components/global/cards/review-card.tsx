import type React from "react"
import { cn } from "@/lib/utils"
import { CardContainer } from "@/components/ui/card-container"
import Image from "next/image"

interface ReviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  reviewText: string
  reviewerName: string
  reviewerImage?: string
  reviewDate: string
  showFullReview?: boolean
}

export function ReviewCard({
  reviewText,
  reviewerName,
  reviewerImage,
  reviewDate,
  showFullReview = false,
  className,
  ...props
}: ReviewCardProps) {
  const truncatedText = showFullReview
    ? reviewText
    : reviewText.length > 150
      ? `${reviewText.substring(0, 150)}...`
      : reviewText

  return (
    <CardContainer
      variant="elevated"
      className={cn("group hover:shadow-strong transition-all duration-300", className)}
      {...props}
    >
      <div className="space-y-4">
        <div className="relative rounded-xl  p-4 pb-6">
          <p className="italic leading-relaxed">&quot;{truncatedText}&quot;</p>
          <div className="absolute -bottom-3 left-5 h-6 w-6 rotate-45 "></div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {reviewerImage ? (
            <div className="h-12 w-12 overflow-hidden rounded-full shadow-md transition-transform duration-300 group-hover:scale-105">
              <Image
                src={reviewerImage || "/placeholder.svg"}
                alt={reviewerName}
                fill
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-md">
              <span className="text-lg font-medium">{reviewerName.charAt(0)}</span>
            </div>
          )}

          <div>
            <div className="font-semibold ">{reviewerName}</div>
            <div className="text-sm ">{reviewDate}</div>
          </div>
        </div>

        {!showFullReview && reviewText.length > 150 && (
          <button className="mt-2 text-sm font-medium  transition-colors">
            Show more
          </button>
        )}
      </div>
    </CardContainer>
  )
}

