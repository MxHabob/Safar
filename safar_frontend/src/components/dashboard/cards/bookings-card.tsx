"use client"
import { Calendar } from "lucide-react"
import { StatCard } from "../ui/stat-card"
import { VerticalLines } from "../ui/vertical-lines"

interface BookingsCardProps {
  totalBookings: number
  upcomingBookings: number
}

export function BookingsCard({ totalBookings, upcomingBookings }: BookingsCardProps) {
  return (
    <StatCard title="Your Bookings" icon={<Calendar className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{totalBookings}</div>
          <p className="text-xs text-muted-foreground">{upcomingBookings} upcoming this month</p>
        </div>
        <VerticalLines count={5} />
      </div>
    </StatCard>
  )
}
