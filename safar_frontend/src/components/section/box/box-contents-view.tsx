"use client"

import type { Box } from "@/redux/types/types"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, DollarSign } from "lucide-react"

interface BoxContentsViewProps {
  box: Box
  onItemClick: (id: string) => void
  selectedItemId: string | null
}

export default function BoxContentsView({ box, onItemClick, selectedItemId }: BoxContentsViewProps) {
  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Travel Box Summary</CardTitle>
          <CardDescription>
            {box.country && box.city && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {box.city}, {box.country}
                </span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {box.images && box.images.length > 0 && (
            <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden">
              <Image src={box.images[0].file || "/placeholder.svg"} alt={box.name} fill className="object-cover" />
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="font-medium">Total Price</h3>
              <p className="text-xl font-bold">
                {box.total_price ? formatCurrency(box.total_price, box.currency) : "Contact for pricing"}
              </p>
            </div>

            <div className="flex gap-2">
              {box.places && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {box.places.length} {box.places.length === 1 ? "Place" : "Places"}
                </Badge>
              )}

              {box.experiences && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {box.experiences.length} {box.experiences.length === 1 ? "Experience" : "Experiences"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview section */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Travel Itinerary</h2>
        <p className="text-muted-foreground">Click on any place or experience below to see its location on the map.</p>
      </div>
      {box.places && box.places.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-bold">Places to Visit</h2>
            <Badge>{box.places.length}</Badge>
          </div>
          <div className="grid gap-4">
            {box.places.map((place) => (
              <Card
                key={place.id}
                className={`cursor-pointer transition-all ${
                  selectedItemId === place.id ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
                onClick={() => onItemClick(place.id)}
              >
                <div className="flex flex-col sm:flex-row">
                  {place.images && place.images.length > 0 && (
                    <div className="relative h-32 sm:w-32 sm:h-full">
                      <Image
                        src={place.images[0].file || "/placeholder.svg"}
                        alt={place.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{place.name}</h3>
                      {place.rating && <Badge variant="secondary">★ {place.rating.toFixed(1)}</Badge>}
                    </div>

                    {place.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {place.country && (
                        <Badge variant="outline" className="text-xs">
                          {place.country}
                        </Badge>
                      )}
                      {place.city && (
                        <Badge variant="outline" className="text-xs">
                          {place.city}
                        </Badge>
                      )}
                      {place.price && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(place.price, place.currency)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Separator between sections */}
      {box.places && box.places.length > 0 && box.experiences && box.experiences.length > 0 && (
        <Separator className="my-6" />
      )}

      {/* Experiences section */}
      {box.experiences && box.experiences.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-bold">Experiences</h2>
            <Badge>{box.experiences.length}</Badge>
          </div>
          <div className="grid gap-4">
            {box.experiences.map((experience) => (
              <Card
                key={experience.id}
                className={`cursor-pointer transition-all ${
                  selectedItemId === experience.id ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
                onClick={() => onItemClick(experience.id)}
              >
                <div className="flex flex-col sm:flex-row">
                  {experience.images && experience.images.length > 0 && (
                    <div className="relative h-32 sm:w-32 sm:h-full">
                      <Image
                        src={experience.images[0].url || "/placeholder.svg"}
                        alt={experience.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{experience.title}</h3>
                      {experience.rating && <Badge variant="secondary">★ {experience.rating.toFixed(1)}</Badge>}
                    </div>

                    {experience.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{experience.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {experience.duration} min
                      </Badge>

                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(experience.price_per_person, experience.currency)} per person
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Additional information section */}
      {box.contents && box.contents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-3">Additional Information</h2>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {box.contents.map((content, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-primary font-medium">{index + 1}</span>
                    </div>
                    <div>
                      {Object.entries(content).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}: </span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

