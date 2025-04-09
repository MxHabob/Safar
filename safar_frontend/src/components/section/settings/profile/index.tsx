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

// Mock data based on the provided interfaces
const mockUser: User = {
  id: "1",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-04-01T00:00:00Z",
  is_deleted: false,
  email: "angel.john@example.com",
  first_name: "Angel",
  last_name: "John",
  language: "en",
  timezone: "America/Phoenix",
  preferred_language: "en",
  preferred_currency: "USD",
  is_online: true,
  is_active: true,
  is_staff: false,
  is_2fa_enabled: false,
  role: "guest",
  is_profile_public: true,
  following: ["2", "3", "4", "5"],
  points: 1250,
  membership_level: "gold",
  gender: "prefer_not_to_say",
}

const mockProfile: UserProfile = {
  id: "1",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-04-01T00:00:00Z",
  is_deleted: false,
  user: "1",
  avatar: "/placeholder.svg?height=100&width=100",
  bio: "Travel enthusiast and adventure seeker. Always looking for the next exciting destination.",
  location: {
    type: "Point",
    coordinates: [33.4484, -112.074],
  },
  gender: "prefer_not_to_say",
  travel_history: [
    { id: "1", name: "Paris", date: "2023-03-15" },
    { id: "2", name: "Tokyo", date: "2022-11-10" },
    { id: "3", name: "New York", date: "2022-07-22" },
  ],
  travel_interests: ["Hiking", "Cultural", "Food", "Photography"],
  language_proficiency: {
    english: "native",
    spanish: "intermediate",
    french: "beginner",
  },
  preferred_countries: [],
  privacy_consent: true,
  wants_push_notifications: true,
  wants_sms_notifications: false,
}

export const ProfilePageContent = () => {
  const [user] = useState<User>(mockUser)
  const [profile] = useState<UserProfile>(mockProfile)
  const travelStats = {
    rating: 4.7,
    placesVisited: 12,
    experiencesCreated: 5,
    placesCreated: 3,
    country: "United States",
  }
  return (
    <div className=" mx-8 px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Left column - User info */}
        <div className="flex-1 mt-16">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Image
                src={profile.avatar || "/placeholder.svg?height=100&width=100"}
                alt={`${user.first_name} ${user.last_name}`}
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
                  {user.first_name} {user.last_name}
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
          <StatsCard user={user} stats={travelStats} />
        </div>
      </div>

      {/* Content Sections - Vertically Stacked */}
      <div className="space-y-8">
        {/* About Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">About</h2>
          <AboutSection profile={profile} user={user} />
        </section>

        {/* Travel History Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Travel History</h2>
          <TravelHistory history={profile.travel_history} />
        </section>

        {/* Experiences Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Experiences</h2>
          <ExperiencesSection userId={user.id} />
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
