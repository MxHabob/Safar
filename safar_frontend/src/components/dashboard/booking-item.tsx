import type React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface BookingItemProps {
  title: string
  status: "Pending" | "Confirmed" | "Cancelled"
  actions?: React.ReactNode
  className?: string
}

export function BookingItem({ title, status, actions, className }: BookingItemProps) {
  return (
    <div className={cn("p-4 border-b last:border-0", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm">{title}</p>
      </div>
      <div className="mt-1 flex items-center">
        <Badge variant="outline" className="text-xs font-normal">
          {status}
        </Badge>
      </div>
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  )
}
