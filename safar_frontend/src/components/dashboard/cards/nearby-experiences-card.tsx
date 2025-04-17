"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map } from "lucide-react"

export function NearbyExperiencesCard() {
  const locations = [
    { name: "Desert Safari", distance: "2.3 km" },
    { name: "Beach Resort", distance: "3.5 km" },
    { name: "City Tour", distance: "1.8 km" },
  ]

  return (
    <Card className="col-span-1 row-span-2">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Nearby Experiences</span>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Map className="h-4 w-4 mr-1" />
            <span className="text-xs">View Map</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[300px] bg-muted/20 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 rounded-full bg-primary/20 animate-ping" />
            <div className="w-4 h-4 rounded-full bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="absolute top-1/3 left-1/4">
            <div className="w-3 h-3 rounded-full bg-primary/70" />
          </div>
          <div className="absolute bottom-1/4 right-1/3">
            <div className="w-3 h-3 rounded-full bg-primary/70" />
          </div>
          <div className="absolute top-1/4 right-1/4">
            <div className="w-3 h-3 rounded-full bg-primary/70" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {locations.map((location, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                <span className="text-sm">{location.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{location.distance}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
