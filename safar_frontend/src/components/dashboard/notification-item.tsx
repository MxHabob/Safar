import type React from "react"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  className?: string
}

export function NotificationItem({ icon, title, description, time, className }: NotificationItemProps) {
  return (
    <div className={cn("flex items-start gap-3 p-4 border-b last:border-0", className)}>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
