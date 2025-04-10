"use server"

import { cache } from "react"

interface AmadeusToken {
  access_token: string
  expires_at: number
}

let tokenCache: AmadeusToken | null = null

export async function getAmadeusToken(): Promise<string> {
  // Return cached token if it's still valid (with 5 min buffer)
  if (tokenCache && tokenCache.expires_at > Date.now() + 300000) {
    return tokenCache.access_token
  }

  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Amadeus API credentials not configured")
  }

  const params = new URLSearchParams()
  params.append("grant_type", "client_credentials")
  params.append("client_id", clientId)
  params.append("client_secret", clientSecret)

  try {
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get Amadeus token: ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the token with expiration time
    tokenCache = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error("Error getting Amadeus token:", error)
    throw new Error("Failed to authenticate with Amadeus API")
  }
}

export const getAmadeusClient = cache(async () => {
  const token = await getAmadeusToken()

  return {
    async searchFlights(params: {
      originLocationCode: string
      destinationLocationCode: string
      departureDate: string
      returnDate?: string
      adults: number
      children?: number
      infants?: number
      travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
      currencyCode?: string
      maxPrice?: number
      max?: number
    }) {
      const searchParams = new URLSearchParams()

      // Add required parameters
      searchParams.append("originLocationCode", params.originLocationCode)
      searchParams.append("destinationLocationCode", params.destinationLocationCode)
      searchParams.append("departureDate", params.departureDate)
      searchParams.append("adults", params.adults.toString())

      // Add optional parameters if provided
      if (params.returnDate) searchParams.append("returnDate", params.returnDate)
      if (params.children) searchParams.append("children", params.children.toString())
      if (params.infants) searchParams.append("infants", params.infants.toString())
      if (params.travelClass) searchParams.append("travelClass", params.travelClass)
      if (params.currencyCode) searchParams.append("currencyCode", params.currencyCode)
      if (params.maxPrice) searchParams.append("maxPrice", params.maxPrice.toString())
      if (params.max) searchParams.append("max", params.max.toString())

      const response = await fetch(
        `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 0 }, // Don't cache this request
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Amadeus API error:", errorText)
        throw new Error(`Failed to search flights: ${response.statusText}`)
      }

      return response.json()
    },

    async getAirportSearch(keyword: string) {
      const response = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}&page[limit]=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to search airports: ${response.statusText}`)
      }

      return response.json()
    },

    async getFlightPrice(flightOfferId: string, flightOfferData: any) {
      const response = await fetch("https://test.api.amadeus.com/v1/shopping/flight-offers/pricing", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [flightOfferData],
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get flight price: ${response.statusText}`)
      }

      return response.json()
    },
  }
})
