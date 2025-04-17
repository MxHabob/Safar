"use client"

import type { ReactNode } from "react"

interface NotificationItemProps {
  icon: ReactNode
  title: string
  description: string
  time: string
}

export function NotificationItem({ icon, title, description, time }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
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
