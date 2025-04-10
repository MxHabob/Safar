import { Suspense } from "react"
import type { Metadata } from "next"
import { getFlightOffers } from "@/app/actions/flight-actions"
import FlightResultsList from "@/components/flights/flight-results-list"
import FlightSearchSummary from "@/components/flights/flight-search-summary"
import { Skeleton } from "@/components/ui/skeleton"
// Import the BookingConfirmationModal at the top of the file
import BookingConfirmationModal from "@/components/flights/booking-confirmation-modal"

export const metadata: Metadata = {
  title: "Flight Search Results | Safar",
  description: "View available flights for your journey",
}

export default async function FlightResultsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Extract search parameters
  const origin = searchParams.origin as string
  const destination = searchParams.destination as string
  const departureDate = searchParams.departureDate as string
  const returnDate = searchParams.returnDate as string | undefined
  const adults = Number.parseInt(searchParams.adults as string) || 1
  const children = Number.parseInt(searchParams.children as string) || 0
  const infants = Number.parseInt(searchParams.infants as string) || 0
  const travelClass = (searchParams.travelClass as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST") || "ECONOMY"
  const directFlights = searchParams.directFlights === "true"

  // Validate required parameters
  if (!origin || !destination || !departureDate) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          <h2 className="text-lg font-semibold">Missing search parameters</h2>
          <p>Please return to the search page and provide all required information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Flight Search Results</h1>

      <FlightSearchSummary
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        returnDate={returnDate}
        passengers={adults + children + infants}
        travelClass={travelClass}
      />

      <Suspense fallback={<FlightResultsSkeleton />}>
        <FlightResults
          searchParams={{
            origin,
            destination,
            departureDate,
            returnDate,
            adults,
            children,
            infants,
            travelClass,
            directFlights,
          }}
        />
      </Suspense>
    </div>
  )
}

async function FlightResults({ searchParams }: { searchParams: any }) {
  const flightOffersResult = await getFlightOffers(searchParams)

  if (flightOffersResult.error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <h2 className="text-lg font-semibold">Error searching flights</h2>
        <p>{flightOffersResult.error}</p>
      </div>
    )
  }

  if (!flightOffersResult.data || flightOffersResult.data.length === 0) {
    return (
      <div className="rounded-md bg-muted p-8 text-center">
        <h2 className="text-lg font-semibold">No flights found</h2>
        <p className="mt-2 text-muted-foreground">
          We couldn't find any flights matching your search criteria. Please try different dates or airports.
        </p>
      </div>
    )
  }

  // Add the BookingConfirmationModal component at the end of the FlightResults function
  // Right before the return statement in the FlightResults function, add:

  return (
    <>
      <FlightResultsList
        flightOffers={flightOffersResult.data}
        dictionaries={flightOffersResult.dictionaries}
        searchParams={searchParams}
      />
      <BookingConfirmationModal />
    </>
  )
}

function FlightResultsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}
