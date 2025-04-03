import type React from "react"
import { cn } from "@/lib/utils"
import { Flag } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"
import { RatingDisplay } from "./rating-display"
import Image from "next/image"

interface HostProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  image: string
  rating: number
  reviewCount: number
  isSuperhost?: boolean
  monthsHosting?: number
  verified?: boolean
}

export function HostProfileCard({
  name,
  image,
  rating,
  reviewCount,
  isSuperhost = false,
  monthsHosting,
  verified = false,
  className,
  ...props
}: HostProfileCardProps) {
  return (
    <CardContainer
      variant="elevated"
      className={cn("overflow-hidden group hover:shadow-strong transition-all duration-300", className)}
      {...props}
    >
      <div className="flex flex-col gap-5">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-full  shadow-md transition-transform duration-300 group-hover:scale-105">
            <Image src={image || "/placeholder.svg"} fill alt={`${name}'s profile`} className="h-full w-full object-cover" />
          </div>
          {verified && (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold ">{name}</h3>
          {isSuperhost && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ">
              <Flag className="h-3.5 w-3.5" />
              <span>Superhost</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 rounded-xl p-4">
          <div className="flex flex-col gap-1">
            <RatingDisplay rating={rating} reviewCount={reviewCount} variant="modern" starColor="text-amber-400" />
            <div className="text-xs ">Rating</div>
          </div>

          {monthsHosting && (
            <div className="flex flex-col gap-1">
              <div className="text-xl font-bold">{monthsHosting}</div>
              <div className="text-xs ">Months hosting</div>
            </div>
          )}
        </div>
      </div>
    </CardContainer>
  )
}

