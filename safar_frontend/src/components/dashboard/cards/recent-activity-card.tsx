"use client"
import { Clock, CreditCard } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "../ui/stat-card"

interface RecentActivityCardProps {
  title: string
  description: string
  time: string
}

export function RecentActivityCard({ title, description, time }: RecentActivityCardProps) {
  return (
    <StatCard title="Recent Activity" icon={<CreditCard className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-muted-foreground">{time}</span>
          </div>
          <Progress value={100} className="h-1 w-24" />
        </div>
      </div>
    </StatCard>
  )
}
