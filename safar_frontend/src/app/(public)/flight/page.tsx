import type { Metadata } from "next"
import FlightSearchForm from "@/components/flights/flight-search-form"

export const metadata: Metadata = {
  title: "Flight Search | Safar",
  description: "Search for flights to your favorite destinations",
}

export default function FlightSearchPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Find Your Flight</h1>
        <FlightSearchForm />
      </div>
    </div>
  )
}
