"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Award, Users, Globe, Compass, Briefcase, Map } from "lucide-react"
import type { User } from "@/types/user"

interface StatsCardProps {
  user: User
  stats: {
    rating: number
    placesVisited: number
    experiencesCreated: number
    placesCreated: number
    country: string
  }
}

export default function StatsCard({ user, stats }: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Define color schemes based on membership level
  const membershipColors = {
    bronze: {
      background: "from-amber-900 to-amber-700",
      highlight: "bg-amber-600",
      wave: "from-amber-600/30 to-amber-500/30",
      badge: "bg-amber-600 hover:bg-amber-700",
      icon: "text-amber-300",
      border: "border-amber-500/30",
    },
    silver: {
      background: "from-slate-700 to-slate-500",
      highlight: "bg-slate-400",
      wave: "from-slate-400/30 to-slate-300/30",
      badge: "bg-slate-400 hover:bg-slate-500",
      icon: "text-slate-300",
      border: "border-slate-400/30",
    },
    gold: {
      background: "from-yellow-600 to-amber-500",
      highlight: "bg-yellow-400",
      wave: "from-yellow-400/30 to-yellow-300/30",
      badge: "bg-yellow-500 hover:bg-yellow-600",
      icon: "text-yellow-300",
      border: "border-yellow-400/30",
    },
  }

  const colors = membershipColors[user.membership_level]

  return (
    <Card
      className={`overflow-hidden relative bg-gradient-to-br ${colors.background} text-white transition-all duration-300 hover:shadow-lg`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wave animation container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`
            absolute 
            bottom-0 
            left-0 
            right-0 
            h-64 
            bg-gradient-to-t 
            ${colors.wave}
            transform 
            ${isHovered ? "translate-y-16" : "translate-y-64"} 
            transition-transform 
            duration-1000 
            ease-in-out
          `}
          style={{
            borderRadius: "100% 100% 0 0",
            opacity: isHovered ? 1 : 0,
          }}
        />
      </div>

      {/* Membership badge */}
      <div className="absolute top-3 right-3">
        <Badge className={`uppercase font-bold ${colors.badge}`}>{user.membership_level}</Badge>
      </div>

      <div className="p-5 relative z-10">
        {/* User name and rating */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold uppercase">{user.first_name}</h2>
          <div className="flex items-center justify-center mt-1">
            <Star className={`h-4 w-4 ${colors.icon} mr-1`} />
            <span className="font-bold">{stats.rating}</span>
          </div>
        </div>

        {/* User points */}
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <div className="text-center">
            <span className="text-xs text-gray-200">TRAVEL POINTS</span>
            <div className="text-2xl font-bold">{user.points}</div>
          </div>
        </div>

        {/* User info */}
        <div className={`border-t ${colors.border} pt-3 mb-3`}>
          <div className="grid grid-cols-2 gap-y-2">
            <div className="flex items-center">
              <Briefcase className={`h-4 w-4 ${colors.icon} mr-2`} />
              <span className="text-sm">{user.role}</span>
            </div>
            <div className="flex items-center">
              <Users className={`h-4 w-4 ${colors.icon} mr-2`} />
              <span className="text-sm">{user.following.length} following</span>
            </div>
            <div className="flex items-center">
              <MapPin className={`h-4 w-4 ${colors.icon} mr-2`} />
              <span className="text-sm">{stats.country}</span>
            </div>
          </div>
        </div>

        {/* Travel stats */}
        <div className={`border-t ${colors.border} pt-3`}>
          <h3 className="text-xs text-gray-200 mb-2 uppercase">Travel Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Map className={`h-4 w-4 ${colors.icon} mr-2`} />
                <span className="text-sm">Places Visited</span>
              </div>
              <span className="font-bold">{stats.placesVisited}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Compass className={`h-4 w-4 ${colors.icon} mr-2`} />
                <span className="text-sm">Experiences</span>
              </div>
              <span className="font-bold">{stats.experiencesCreated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className={`h-4 w-4 ${colors.icon} mr-2`} />
                <span className="text-sm">Places Created</span>
              </div>
              <span className="font-bold">{stats.placesCreated}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Award className={`h-5 w-5 ${colors.icon} mx-auto mb-1`} />
          <span className="text-xs text-gray-300">Travel Enthusiast</span>
        </div>
      </div>
    </Card>
  )
}
