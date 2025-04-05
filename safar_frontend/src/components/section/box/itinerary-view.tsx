"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Flag, MapPin, Clock, DollarSign, ChevronDown, ChevronUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  coordinates: [number, number]
  country?: string
  city?: string
}

interface Activity {
  id: string
  type: "place" | "experience" | "custom"
  name?: string
  title?: string
  description?: string
  location?: Location
  price?: number
  price_per_person?: number
  duration?: number
  images?: string[]
  [key: string]: any
}

interface ItineraryDay {
  day_number: number
  date: string | null
  location: string | null
  activities: Activity[]
}

interface Itinerary {
  box_name: string
  total_price: number
  currency: string
  days: ItineraryDay[]
}

interface ItineraryViewProps {
  itinerary: Itinerary
  visitedPlaces: Set<string>
  onToggleVisited: (placeId: string) => void
  isMapReady: boolean
  activeDay: number | null
  setActiveDay: (day: number | null) => void
}

export default function ItineraryView({
  itinerary,
  visitedPlaces,
  onToggleVisited,
  isMapReady,
  activeDay,
  setActiveDay,
}: ItineraryViewProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const toggleActivityExpanded = (activityId: string) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  const handleDayClick = (dayNumber: number) => {
    setActiveDay(activeDay === dayNumber ? null : dayNumber)
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{itinerary.box_name}</h1>
        <div className="flex justify-between items-center mt-2">
          <div className="text-gray-600">
            {itinerary.days.length} {itinerary.days.length === 1 ? "day" : "days"} itinerary
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1 font-semibold">
            {formatCurrency(itinerary.total_price, itinerary.currency)}
          </Badge>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
        <Button variant={activeDay === null ? "default" : "outline"} size="sm" onClick={() => setActiveDay(null)}>
          All Days
        </Button>
        {itinerary.days.map((day) => (
          <Button
            key={day.day_number}
            variant={activeDay === day.day_number ? "default" : "outline"}
            size="sm"
            onClick={() => handleDayClick(day.day_number)}
          >
            Day {day.day_number}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {itinerary.days
          .filter((day) => activeDay === null || day.day_number === activeDay)
          .map((day) => (
            <div key={day.day_number} className="border rounded-lg overflow-hidden">
              <div
                className=" p-4 flex justify-between items-center cursor-pointer"
                onClick={() => handleDayClick(day.day_number)}
              >
                <div>
                  <h2 className="font-bold text-lg">Day {day.day_number}</h2>
                  {day.location && <p className="text-gray-400">{day.location}</p>}
                </div>
                <ChevronRight
                  className={cn("h-5 w-5 transition-transform", activeDay === day.day_number && "transform rotate-90")}
                />
              </div>

              {(activeDay === null || activeDay === day.day_number) && (
                <div className="p-4">
                  <div className="space-y-4">
                    {day.activities.map((activity, index) => (
                      <Card key={activity.id || index} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 cursor-pointer" onClick={() => toggleActivityExpanded(activity.id)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">
                                    {activity.type}
                                  </Badge>
                                  <h3 className="font-semibold text-lg">
                                    {activity.name || activity.title || "Activity"}
                                  </h3>
                                </div>

                                {activity.location?.city && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    {activity.location.city}
                                    {activity.location.country && `, ${activity.location.country}`}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant={visitedPlaces.has(activity.id) ? "default" : "outline"}
                                  size="sm"
                                  className="h-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleVisited(activity.id)
                                  }}
                                  disabled={!isMapReady}
                                >
                                  {visitedPlaces.has(activity.id) ? (
                                    <>
                                      <Flag className="h-4 w-4 mr-1" /> Visited
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="h-4 w-4 mr-1" /> Mark
                                    </>
                                  )}
                                </Button>

                                {expandedActivities.has(activity.id) ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>

                            {/* Always visible activity details */}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              {activity.duration && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm ml-1">
                                    {activity.duration} {activity.type === "experience" ? "hours" : "days"}
                                  </span>
                                </div>
                              )}

                              {activity.price && (
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm ml-1">
                                    {formatCurrency(activity.price, itinerary.currency)}
                                  </span>
                                </div>
                              )}

                              {activity.price_per_person && (
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm ml-1">
                                    {formatCurrency(activity.price_per_person, itinerary.currency)} per person
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded activity details */}
                          {expandedActivities.has(activity.id) && (
                            <div className="px-4 pb-4">
                              <Separator className="my-3" />

                              {activity.description && <p className="text-sm mb-4">{activity.description}</p>}

                              {activity.images && activity.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  {activity.images.slice(0, 4).map((image, i) => (
                                    <div key={i} className="relative h-32 rounded-md overflow-hidden">
                                      <Image
                                        src={image || "/placeholder.svg"}
                                        alt={activity.name || activity.title || "Activity image"}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Activity specific details */}
                              {activity.type === "place" && activity.check_in_time && (
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Check-in:</span> {activity.check_in_time}
                                  </div>
                                  <div>
                                    <span className="font-medium">Check-out:</span> {activity.check_out_time}
                                  </div>
                                </div>
                              )}

                              {activity.type === "experience" && activity.schedule && (
                                <div className="mt-3">
                                  <h4 className="font-medium text-sm mb-1">Schedule:</h4>
                                  <ul className="text-sm list-disc pl-5">
                                    {Object.entries(activity.schedule).map(([key, value]) => (
                                      <li key={key}>
                                        <span className="font-medium">{key}:</span> {String(value)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {activity.type === "custom" && activity.notes && (
                                <div className="mt-3">
                                  <h4 className="font-medium text-sm mb-1">Notes:</h4>
                                  <p className="text-sm">{activity.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

