"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Map, Star } from "lucide-react"
import type { ReactNode } from "react"

interface BookingItemProps {
  title: string
  location: string
  date: string
  status: string
  actions?: ReactNode
  rating?: number
}

export function BookingItem({ title, location, date, status, actions, rating }: BookingItemProps) {
  return (
    <div className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Map className="h-3 w-3 mr-1" />
        <span>{location}</span>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Calendar className="h-3 w-3 mr-1" />
        <span>{date}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge
          variant={
            status === "Pending"
              ? "outline"
              : status === "Confirmed"
                ? "secondary"
                : status === "Completed"
                  ? "default"
                  : "outline"
          }
          className="text-xs font-normal"
        >
          {status}
        </Badge>

        {rating && (
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs ml-1">{rating}</span>
          </div>
        )}
      </div>
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  )
}
