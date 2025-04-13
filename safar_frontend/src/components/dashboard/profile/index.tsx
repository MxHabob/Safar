"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, MapPin } from "lucide-react"
import type { User, UserProfile } from "@/redux/types/types"
import StatsCard from "@/components/section/settings/profile/stats-card"
import AboutSection from "@/components/section/settings/profile/about-section"
import TravelHistory from "@/components/section/settings/profile/travel-history"
import ExperiencesSection from "@/components/section/settings/profile/experiences-section"
import { useAuth } from "@/redux/hooks/use-auth"

// Mock data based on the provided interfaces


export const ProfilePageContent = () => {
  const { user } = useAuth();

  console.log("user : ", user)
  return (
    <div className=" mx-8 px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Left column - User info */}
        <div className="flex-1 mt-16">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Image
                src={user?.profile?.avatar || "/placeholder.svg?height=100&width=100"}
                alt={`${user?.first_name} ${user?.last_name}`}
                width={80}
                height={80}
                className="rounded-full bg-gray-200"
              />
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {user?.first_name} {user?.last_name} {user?.username}
                </h1>
              </div>
              <div className="flex items-center text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">United States - Arizona - Madeley</span>
              </div>
              <div className="mt-4 space-y-1">
                <div className="h-2 bg-gray-200 rounded-full w-full max-w-[200px]"></div>
                <div className="h-2 bg-gray-200 rounded-full w-full max-w-[180px]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Stats card */}
        <div className="md:w-[300px]">
          {/* <StatsCard user={user} stats={travelStats} /> */}
        </div>
      </div>

      {/* Content Sections - Vertically Stacked */}
      <div className="space-y-8">
        {/* About Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">About</h2>
          {/* <AboutSection profile={user?.profile} user={user} /> */}
        </section>

        {/* Travel History Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Travel History</h2>
          {/* <TravelHistory history={user?.profile.travel_history} /> */}
        </section>

        {/* Experiences Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Experiences</h2>
          <ExperiencesSection userId={user?.id} />
        </section>

        {/* Reviews Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Reviews</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <p>No reviews yet</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}