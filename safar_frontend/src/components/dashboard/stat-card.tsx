import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  icon?: React.ReactNode
  chart?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, icon, chart, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {chart && <div className="h-[40px]">{chart}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
