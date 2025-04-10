"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addMinutes } from "date-fns"
import { ArrowRight, Clock, Plane } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useModal } from "@/redux/features/ui/modal-slice"

interface FlightResultsListProps {
  flightOffers: any[]
  dictionaries: any
  searchParams: any
}

export default function FlightResultsList({ flightOffers, dictionaries, searchParams }: FlightResultsListProps) {
  const router = useRouter()
  const { onOpen } = useModal()
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price")

  // Sort flight offers
  const sortedFlightOffers = [...flightOffers].sort((a, b) => {
    if (sortBy === "price") {
      return Number.parseFloat(a.price.total) - Number.parseFloat(b.price.total)
    } else if (sortBy === "duration") {
      return a.itineraries[0].duration.localeCompare(b.itineraries[0].duration)
    } else {
      return a.itineraries[0].segments[0].departure.at.localeCompare(b.itineraries[0].segments[0].departure.at)
    }
  })

  // Format duration from PT2H30M to 2h 30m
  const formatDuration = (duration: string) => {
    const hours = duration.match(/(\d+)H/)?.[1] || "0"
    const minutes = duration.match(/(\d+)M/)?.[1] || "0"
    return `${hours}h ${minutes}m`
  }

  // Calculate arrival time based on departure time and duration
  const calculateArrivalTime = (departureTime: string, duration: string) => {
    const durationHours = Number.parseInt(duration.match(/(\d+)H/)?.[1] || "0")
    const durationMinutes = Number.parseInt(duration.match(/(\d+)M/)?.[1] || "0")
    const totalMinutes = durationHours * 60 + durationMinutes

    return addMinutes(new Date(departureTime), totalMinutes)
  }

  // Get airline name from dictionary
  const getAirlineName = (carrierCode: string) => {
    return dictionaries.carriers[carrierCode] || carrierCode
  }

  const handleBookFlight = (flightOffer: any) => {
    // Convert the flight offer to your Flight model
    const flight = {
      id: flightOffer.id,
      airline: getAirlineName(flightOffer.itineraries[0].segments[0].carrierCode),
      flight_number: flightOffer.itineraries[0].segments[0].number,
      departure_airport: flightOffer.itineraries[0].segments[0].departure.iataCode,
      arrival_airport:
        flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.iataCode,
      departure_time: flightOffer.itineraries[0].segments[0].departure.at,
      arrival_time: flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.at,
      price: Number.parseFloat(flightOffer.price.total),
      currency: flightOffer.price.currency,
      duration: formatDuration(flightOffer.itineraries[0].duration),
      // Add other fields as needed
    }

    // Open booking modal with the flight data and search params
    onOpen("BookingConfirmationOrCancellation", {
      Flight: flight,
      searchParams: searchParams,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground">
          {flightOffers.length} {flightOffers.length === 1 ? "flight" : "flights"} found
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <div className="flex gap-2">
            <Button variant={sortBy === "price" ? "default" : "outline"} size="sm" onClick={() => setSortBy("price")}>
              Price
            </Button>
            <Button
              variant={sortBy === "duration" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("duration")}
            >
              Duration
            </Button>
            <Button
              variant={sortBy === "departure" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("departure")}
            >
              Departure
            </Button>
          </div>
        </div>
      </div>

      {sortedFlightOffers.map((offer) => (
        <Card key={offer.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Airline */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plane className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium">{getAirlineName(offer.itineraries[0].segments[0].carrierCode)}</h3>
                  <p className="text-sm text-muted-foreground">Flight {offer.itineraries[0].segments[0].number}</p>
                </div>
              </div>

              {/* Times */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-medium">
                    {format(new Date(offer.itineraries[0].segments[0].departure.at), "HH:mm")}
                  </p>
                  <p className="text-sm text-muted-foreground">{offer.itineraries[0].segments[0].departure.iataCode}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-xs text-muted-foreground">{formatDuration(offer.itineraries[0].duration)}</p>
                  <div className="relative w-16">
                    <Separator className="my-2" />
                    <ArrowRight className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {offer.itineraries[0].segments.length > 1
                      ? `${offer.itineraries[0].segments.length - 1} stop${offer.itineraries[0].segments.length > 2 ? "s" : ""}`
                      : "Direct"}
                  </p>
                </div>

                <div className="text-center">
                  <p className="font-medium">
                    {format(
                      new Date(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at),
                      "HH:mm",
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.iataCode}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {Number.parseFloat(offer.price.total).toFixed(2)} {offer.price.currency}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchParams.adults} {Number.parseInt(searchParams.adults) === 1 ? "passenger" : "passengers"}
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="details">
                <AccordionTrigger>Flight Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {offer.itineraries[0].segments.map((segment: any, index: number) => (
                      <div key={index} className="rounded-md border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getAirlineName(segment.carrierCode)}</Badge>
                            <span className="text-sm">Flight {segment.number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDuration(segment.duration)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{format(new Date(segment.departure.at), "HH:mm")}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(segment.departure.at), "EEE, MMM d")}
                            </p>
                            <p className="text-sm">{segment.departure.iataCode}</p>
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground" />

                          <div className="text-right">
                            <p className="font-medium">{format(new Date(segment.arrival.at), "HH:mm")}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(segment.arrival.at), "EEE, MMM d")}
                            </p>
                            <p className="text-sm">{segment.arrival.iataCode}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Fare details */}
                    <div className="rounded-md border p-4">
                      <h4 className="mb-2 font-medium">Fare Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base fare</span>
                          <span>
                            {Number.parseFloat(offer.price.base).toFixed(2)} {offer.price.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes and fees</span>
                          <span>
                            {(Number.parseFloat(offer.price.total) - Number.parseFloat(offer.price.base)).toFixed(2)}{" "}
                            {offer.price.currency}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            {Number.parseFloat(offer.price.total).toFixed(2)} {offer.price.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          <CardFooter className="flex justify-end bg-muted/50 p-4">
            <Button onClick={() => handleBookFlight(offer)}>Select Flight</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
