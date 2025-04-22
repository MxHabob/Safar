
"use client";
import { DashboardHeader } from "@/components/dashboard/sections/dashboard-header"
import { MainContentGrid } from "@/components/dashboard/sections/main-content-grid"
import { RecommendedExperiences } from "@/components/dashboard/sections/recommended-experiences"
import { StatsRow } from "@/components/dashboard/sections/stats-row"
import { useAuth } from "@/core/hooks/use-auth"



export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
    <DashboardHeader user={user} />
    <StatsRow />
    <MainContentGrid user={user} />
    {user && user.role === 'admin' ? <RecommendedExperiences /> : ""}
  </div>
  )
}