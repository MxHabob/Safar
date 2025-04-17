"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Star } from "lucide-react"
import type { Experience } from "@/core/types"

interface ExperienceCardProps {
  experience: Experience
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[150px]">
        <img
          src={experience.media.file || "/placeholder.svg"}
          alt={experience.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-background"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium">{experience.title}</h3>
        <div className="flex items-center mt-1">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs ml-1">{experience.rating}</span>
          <span className="text-xs text-muted-foreground ml-1">({experience.rating || 47} reviews)</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">{experience.price_per_person || 0}</span>
          <span className="text-xs text-muted-foreground">per person</span>
        </div>
      </CardContent>
    </Card>
  )
}
