"use client"

import { AestheticDepositsCard } from "../cards/aesthetic-deposits-card"
import { BookingsCard } from "../cards/bookings-card"
import { RecentActivityCard } from "../cards/recent-activity-card"

export function StatsRow() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AestheticDepositsCard value={0} percentage={0} />
      <BookingsCard totalBookings={0} upcomingBookings={0} />
      <RecentActivityCard title="Payment Received" description="Transaction #28492" time="Today at 2:34 PM" />
    </div>
  )
}
