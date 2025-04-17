"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusCircle } from "../ui/status-circle"

interface LoyaltyStatusCardProps {
  membershipLevel: string
  currentPoints: number
  targetPoints: number
}

export function LoyaltyStatusCard({ membershipLevel, currentPoints, targetPoints }: LoyaltyStatusCardProps) {
  const pointsUntilNextLevel = targetPoints - currentPoints

  return (
    <Card className="col-span-1 row-span-1">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex justify-between">
          <span>Loyalty Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-center">
        <div className="text-xl font-bold mb-2">{membershipLevel}</div>
        <StatusCircle value={currentPoints} maxValue={targetPoints} />
        <div className="mt-2 text-xs text-muted-foreground">{pointsUntilNextLevel} points until Diamond status</div>
      </CardContent>
    </Card>
  )
}
