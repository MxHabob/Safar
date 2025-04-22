"use client"

import { formatRelativeTime } from "@/lib/utils/date-formatter"
import type { ReactNode } from "react"

interface NotificationItemProps {
  icon: ReactNode
  type: string
  message: string
  updated_at: string
}

export function NotificationItem({ icon, type, message, updated_at }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{type}</p>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(updated_at)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
