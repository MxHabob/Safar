"use client"

import { AestheticDepositsCard } from "../cards/aesthetic-deposits-card"
import { BookingsCard } from "../cards/bookings-card"
import { RecentActivityCard } from "../cards/recent-activity-card"

export function StatsRow() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AestheticDepositsCard value={489.57} percentage={2.5} />
      <BookingsCard totalBookings={16} upcomingBookings={4} />
      <RecentActivityCard title="Payment Received" description="Transaction #28492" time="Today at 2:34 PM" />
    </div>
  )
}
