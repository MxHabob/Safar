"use client"
import { DollarSign } from "lucide-react"
import { StatCard } from "../ui/stat-card"
import { BarChart } from "../ui/bar-chart"

interface AestheticDepositsCardProps {
  value: number
  percentage: number
}

export function AestheticDepositsCard({ value, percentage }: AestheticDepositsCardProps) {
  const barHeights = [20, 30, 15, 25, 18, 22, 28]

  return (
    <StatCard title="Aesthetic Deposits" icon={<DollarSign className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">+{percentage}% from last month</p>
        </div>
        <BarChart heights={barHeights} />
      </div>
    </StatCard>
  )
}
