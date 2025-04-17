"use client"

import { NotificationsCard } from "../cards/notifications-card"
import { LoyaltyStatusCard } from "../cards/loyalty-status-card"
import { NearbyExperiencesCard } from "../cards/nearby-experiences-card"
import { UpcomingBookingsCard } from "../cards/upcoming-bookings-card"
import type { User } from "@/core/types"

interface MainContentGridProps {
  user: User | null
}

export function MainContentGrid({ user }: MainContentGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NotificationsCard />
      <LoyaltyStatusCard membershipLevel={user?.membership_level || "Gold"} currentPoints={287} targetPoints={500} />
      <NearbyExperiencesCard />
      <UpcomingBookingsCard />
    </div>
  )
}
