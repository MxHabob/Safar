"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { ExperienceCard } from "../ui/experience-card"
import type { Experience } from "@/core/types"

export function RecommendedExperiences() {
  const experiences: Experience[] = [
    {
      title: "Desert Safar",
      
      price_per_person: 89,
      rating: 4.8,
      location: "",
      currency: "",
      duration: 0,
      capacity: 0,
      schedule: [],
      is_available: false,
      id: "",
      created_at: "",
      updated_at: "",
      is_deleted: false,
    },
    {
      title: "Yacht Cruise",
      price_per_person: 199,
      rating: 4.9,
      location: "",
      currency: "",
      duration: 0,
      capacity: 0,
      schedule: [],
      is_available: false,
      id: "",
      created_at: "",
      updated_at: "",
      is_deleted: false,
    },
    {
      title: "Cultural Tour",
      price_per_person: 45,
      rating: 4.7,
      location: "",
      currency: "",
      duration: 0,
      capacity: 0,
      schedule: [],
      is_available: false,
      id: "",
      created_at: "",
      updated_at: "",
      is_deleted: false,
      owner: undefined
    },
    {
      title: "Skydiving Experience",
      price_per_person: 299,
      rating: 5.0,
      location: "",
      currency: "",
      duration: 0,
      capacity: 0,
      schedule: [],
      is_available: false,
      id: "",
      created_at: "",
      updated_at: "",
      is_deleted: false,
      owner: undefined
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recommended for You</h2>
        <Button variant="ghost" size="sm">
          View all <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {experiences.map((experience, index) => (
          <ExperienceCard key={index} experience={experience} />
        ))}
      </div>
    </div>
  )
}