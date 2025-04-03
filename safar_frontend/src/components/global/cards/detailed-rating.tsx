import type React from "react"
import { cn } from "@/lib/utils"
import { CardContainer } from "@/components/ui/card-container"

interface CategoryRating {
  category: string
  rating: number
  icon?: React.ReactNode
}

interface DetailedRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  overallRating: number
  categoryRatings: CategoryRating[]
  description?: string
}

export function DetailedRating({
  overallRating,
  categoryRatings,
  description,
  className,
  ...props
}: DetailedRatingProps) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-6">
          <div className="transform rotate-180">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-float"
            >
              <path
                d="M12 6.75C10.9395 6.75 9.88495 6.96399 8.9129 7.37398C7.94085 7.78397 7.06606 8.38187 6.33318 9.13318C5.60029 9.88448 5.02399 10.7755 4.62601 11.7571C4.22803 12.7387 4.02725 13.8001 4.02725 14.8729C4.02725 15.9457 4.22803 17.0071 4.62601 17.9887C5.02399 18.9703 5.60029 19.8613 6.33318 20.6126C7.06606 21.3639 7.94085 21.9618 8.9129 22.3718C9.88495 22.7818 10.9395 22.9958 12 22.9958C14.1435 22.9958 16.1988 22.1322 17.6967 20.6126C19.1947 19.0929 20.0455 17.0196 20.0455 14.8729C20.0455 12.7261 19.1947 10.6529 17.6967 9.13318C16.1988 7.61351 14.1435 6.75 12 6.75Z"
                fill="#333333"
              />
              <path
                d="M12 4.5C11.4033 4.5 10.831 4.26295 10.409 3.84099C9.98705 3.41903 9.75 2.84674 9.75 2.25C9.75 1.65326 9.98705 1.08097 10.409 0.65901C10.831 0.237053 11.4033 0 12 0C12.5967 0 13.169 0.237053 13.591 0.65901C14.0129 1.08097 14.25 1.65326 14.25 2.25C14.25 2.84674 14.0129 3.41903 13.591 3.84099C13.169 4.26295 12.5967 4.5 12 4.5Z"
                fill="#333333"
              />
              <path
                d="M18.75 5.25C18.1533 5.25 17.581 5.01295 17.159 4.59099C16.7371 4.16903 16.5 3.59674 16.5 3C16.5 2.40326 16.7371 1.83097 17.159 1.40901C17.581 0.987053 18.1533 0.75 18.75 0.75C19.3467 0.75 19.919 0.987053 20.341 1.40901C20.7629 1.83097 21 2.40326 21 3C21 3.59674 20.7629 4.16903 20.341 4.59099C19.919 5.01295 19.3467 5.25 18.75 5.25Z"
                fill="#333333"
              />
              <path
                d="M5.25 5.25C4.65326 5.25 4.08097 5.01295 3.65901 4.59099C3.23705 4.16903 3 3.59674 3 3C3 2.40326 3.23705 1.83097 3.65901 1.40901C4.08097 0.987053 4.65326 0.75 5.25 0.75C5.84674 0.75 6.41903 0.987053 6.84099 1.40901C7.26295 1.83097 7.5 2.40326 7.5 3C7.5 3.59674 7.26295 4.16903 6.84099 4.59099C6.41903 5.01295 5.84674 5.25 5.25 5.25Z"
                fill="#333333"
              />
            </svg>
          </div>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-7xl font-bold text-transparent">
            {overallRating}
          </div>
          <div className="animate-float" style={{ animationDelay: "0.5s" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 6.75C10.9395 6.75 9.88495 6.96399 8.9129 7.37398C7.94085 7.78397 7.06606 8.38187 6.33318 9.13318C5.60029 9.88448 5.02399 10.7755 4.62601 11.7571C4.22803 12.7387 4.02725 13.8001 4.02725 14.8729C4.02725 15.9457 4.22803 17.0071 4.62601 17.9887C5.02399 18.9703 5.60029 19.8613 6.33318 20.6126C7.06606 21.3639 7.94085 21.9618 8.9129 22.3718C9.88495 22.7818 10.9395 22.9958 12 22.9958C14.1435 22.9958 16.1988 22.1322 17.6967 20.6126C19.1947 19.0929 20.0455 17.0196 20.0455 14.8729C20.0455 12.7261 19.1947 10.6529 17.6967 9.13318C16.1988 7.61351 14.1435 6.75 12 6.75Z"
                fill="#333333"
              />
              <path
                d="M12 4.5C11.4033 4.5 10.831 4.26295 10.409 3.84099C9.98705 3.41903 9.75 2.84674 9.75 2.25C9.75 1.65326 9.98705 1.08097 10.409 0.65901C10.831 0.237053 11.4033 0 12 0C12.5967 0 13.169 0.237053 13.591 0.65901C14.0129 1.08097 14.25 1.65326 14.25 2.25C14.25 2.84674 14.0129 3.41903 13.591 3.84099C13.169 4.26295 12.5967 4.5 12 4.5Z"
                fill="#333333"
              />
              <path
                d="M18.75 5.25C18.1533 5.25 17.581 5.01295 17.159 4.59099C16.7371 4.16903 16.5 3.59674 16.5 3C16.5 2.40326 16.7371 1.83097 17.159 1.40901C17.581 0.987053 18.1533 0.75 18.75 0.75C19.3467 0.75 19.919 0.987053 20.341 1.40901C20.7629 1.83097 21 2.40326 21 3C21 3.59674 20.7629 4.16903 20.341 4.59099C19.919 5.01295 19.3467 5.25 18.75 5.25Z"
                fill="#333333"
              />
              <path
                d="M5.25 5.25C4.65326 5.25 4.08097 5.01295 3.65901 4.59099C3.23705 4.16903 3 3.59674 3 3C3 2.40326 3.23705 1.83097 3.65901 1.40901C4.08097 0.987053 4.65326 0.75 5.25 0.75C5.84674 0.75 6.41903 0.987053 6.84099 1.40901C7.26295 1.83097 7.5 2.40326 7.5 3C7.5 3.59674 7.26295 4.16903 6.84099 4.59099C6.41903 5.01295 5.84674 5.25 5.25 5.25Z"
                fill="#333333"
              />
            </svg>
          </div>
        </div>

        <h3 className="mt-4 text-2xl font-bold">Guest favorite</h3>
        {description && <p className="mx-auto mt-2 max-w-md">{description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categoryRatings.map((category, index) => (
          <CardContainer
            key={index}
            variant="glass"
            className="flex flex-col items-center p-6 transition-transform duration-300 hover:scale-105"
          >
            <div className="text-3xl font-bold ">{category.rating}</div>
            <div className="my-4 flex h-12 w-12 items-center justify-center rounded-full">
              {category.icon}
            </div>
            <div className="text-center font-medium ">{category.category}</div>
          </CardContainer>
        ))}
      </div>

      <CardContainer variant="outline" className="p-6">
        <h4 className="mb-4 font-semibold ">Overall rating</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="w-6 text-right font-medium ">{rating}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r  transition-all duration-500"
                  style={{
                    width:
                      rating === Math.round(overallRating) ? "80%" : rating > Math.round(overallRating) ? "10%" : "30%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  )
}

