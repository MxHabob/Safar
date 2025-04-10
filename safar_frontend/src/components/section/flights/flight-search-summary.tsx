import { format, parseISO } from "date-fns"
import { ArrowRight, Calendar, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface FlightSearchSummaryProps {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  travelClass: string
}

export default function FlightSearchSummary({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers,
  travelClass,
}: FlightSearchSummaryProps) {
  // Format travel class for display
  const formatTravelClass = (travelClass: string) => {
    switch (travelClass) {
      case "ECONOMY":
        return "Economy"
      case "PREMIUM_ECONOMY":
        return "Premium Economy"
      case "BUSINESS":
        return "Business"
      case "FIRST":
        return "First Class"
      default:
        return travelClass
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-center gap-4 p-4 md:flex-nowrap">
        <div className="flex flex-1 items-center gap-2">
          <Badge variant="outline" className="text-lg font-bold">
            {origin}
          </Badge>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-lg font-bold">
            {destination}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(parseISO(departureDate), "MMM d, yyyy")}
            {returnDate && ` - ${format(parseISO(returnDate), "MMM d, yyyy")}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
          </span>
        </div>

        <Badge variant="secondary">{formatTravelClass(travelClass)}</Badge>
      </CardContent>
    </Card>
  )
}
