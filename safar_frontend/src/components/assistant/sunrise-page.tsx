"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react"
import { useGetPersonalizedBoxMutation, useGetCountriesQuery } from "@/core/services/api"
import type { Box } from "@/core/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Send, MapPin, Search } from "lucide-react"

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  box?: Box
}

type DestinationSelection = {
  id: string
  name: string
  type: "city" | "region" | "country"
}

export const SunrisePage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hi there! I'm Blue your travel assistant. Where would you like to travel? You can select a destination from our list or type in your dream destination.",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showDestinationDialog, setShowDestinationDialog] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<DestinationSelection | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])

  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesQuery({ page_size: 100 })
  const [generateBox, { isLoading }] = useGetPersonalizedBoxMutation()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedDestination) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: selectedDestination
        ? `I want to visit ${selectedDestination.name}${inputValue ? `: ${inputValue}` : ""}`
        : inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // If we have a selected destination, use it directly
      let params: any = {
        start_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
      }

      if (selectedDestination) {
        params.destination_id = selectedDestination.id
        params.destination_type = selectedDestination.type
      } else {
        // Otherwise try to extract from message
        const extractedParams = extractTravelParams(userMessage.content, selectedDate)
        params = { ...params, ...extractedParams }
      }

      if (!params.destination_id || !params.destination_type) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content:
                "Could you please select a destination from our list? Click the globe icon to see available destinations.",
              sender: "assistant",
              timestamp: new Date(),
            },
          ])
          setIsTyping(false)
        }, 1000)
        return
      }

      const result = await generateBox(params).unwrap()
      console.log("Generated box:", result)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `I've created a personalized travel box for your trip to ${result.name || selectedDestination?.name || params.destination_id}! Here are the details:`,
          sender: "assistant",
          timestamp: new Date(),
          box: result,
        },
      ])
    } catch (error) {
      console.error("Error generating box:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content:
            "I'm sorry, I couldn't create a travel box at the moment. Please try again with more specific details.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
      setSelectedDate(undefined)
      setSelectedDestination(null)
    }
  }

  const extractTravelParams = (message: string, startDate?: Date) => {
    const params: {
      destination_id: string
      destination_type: "city" | "region" | "country"
      duration_days?: number
      budget?: number
      theme?: string
      start_date?: string
    } = {
      destination_id: "",
      destination_type: "city",
    }

    const cityMatch = message.match(/(?:visit|go to|travel to|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    if (cityMatch && cityMatch[1]) {
      params.destination_id = cityMatch[1]

      if (["USA", "UK", "Japan", "France", "Italy", "Spain", "Germany"].includes(cityMatch[1])) {
        params.destination_type = "country"
      } else if (["California", "Tuscany", "Provence", "Bavaria"].includes(cityMatch[1])) {
        params.destination_type = "region"
      } else {
        params.destination_type = "city"
      }
    }

    const durationMatch = message.match(/(\d+)\s+(?:days|day|nights|night)/i)
    if (durationMatch && durationMatch[1]) {
      params.duration_days = Number.parseInt(durationMatch[1], 10)
    }

    const budgetMatch = message.match(/(?:budget of|spend|cost)\s+\$?(\d+(?:,\d+)?)/i)
    if (budgetMatch && budgetMatch[1]) {
      params.budget = Number.parseInt(budgetMatch[1].replace(",", ""), 10)
    }

    const themeKeywords = {
      adventure: ["adventure", "hiking", "outdoor", "extreme", "adrenaline"],
      relaxation: ["relaxation", "relax", "peaceful", "calm", "spa"],
      culture: ["culture", "museum", "history", "art", "architecture"],
      food: ["food", "culinary", "gastronomy", "dining", "restaurant"],
      romantic: ["romantic", "honeymoon", "couple", "anniversary"],
      family: ["family", "kids", "children", "family-friendly"],
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some((keyword) => message.toLowerCase().includes(keyword))) {
        params.theme = theme
        break
      }
    }

    if (startDate) {
      params.start_date = format(startDate, "yyyy-MM-dd")
    } else {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ]
      const monthPattern = months.join("|")
      const dateMatch = message.match(new RegExp(`(${monthPattern})\\s+(\\d+)(?:st|nd|rd|th)?`, "i"))

      if (dateMatch && dateMatch[1] && dateMatch[2]) {
        const month = months.indexOf(dateMatch[1].toLowerCase())
        const day = Number.parseInt(dateMatch[2], 10)
        const year = new Date().getFullYear()
        const date = new Date(year, month, day)

        if (date < new Date()) {
          date.setFullYear(year + 1)
        }

        params.start_date = format(date, "yyyy-MM-dd")
      }
    }

    return params
  }

  const handleDestinationSelect = (destination: DestinationSelection) => {
    setSelectedDestination(destination)
    setShowDestinationDialog(false)
  }

  const toggleCountryFilter = (countryName: string) => {
    setSelectedCountries((prev) =>
      prev.includes(countryName) ? prev.filter((c) => c !== countryName) : [...prev, countryName],
    )
  }

  const filteredCountries =
    countriesData?.results.filter(
      (country) => !searchQuery || country.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  // Featured destinations - would normally come from an API
  const featuredDestinations = [
    { id: "dest1", name: "Paris", type: "city", country: "France", image: "/placeholder.svg?height=200&width=300" },
    { id: "dest2", name: "Tokyo", type: "city", country: "Japan", image: "/placeholder.svg?height=200&width=300" },
  ]

  // Popular countries for filters
  const popularCountries = ["Yemen", "United States", "United States", "Australia", "France", "Belgium"]

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      <header className="border-b py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/assistant-avatar.png" alt="AI Assistant" />
              <AvatarFallback className="bg-primary text-primary-foreground">Bl</AvatarFallback>
            </Avatar>
            <div className="w-64 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex items-center">
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">ML</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredDestinations.map((destination) => (
            <Card key={destination.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                <div className="absolute top-2 right-2 w-6 h-1 bg-gray-300"></div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-gray-300 rounded"></div>
                  <div className="h-3 w-20 bg-gray-300 rounded"></div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="h-2 w-full bg-gray-300 rounded"></div>
                  <div className="h-2 w-5/6 bg-gray-300 rounded"></div>
                  <div className="h-2 w-4/6 bg-gray-300 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t py-4 px-4">
        <div className="container mx-auto space-y-3">
          <div className="flex flex-wrap gap-2">
            {popularCountries.map((country, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`rounded-full px-3 py-1 cursor-pointer ${
                  selectedCountries.includes(country) ? "bg-gray-200" : "bg-gray-100"
                }`}
                onClick={() => toggleCountryFilter(country)}
              >
                {country}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search destinations..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="bg-gray-100 border-gray-200"
              />
            </div>
            <Button type="submit" size="icon" onClick={handleSendMessage} className="rounded-full bg-primary">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Preserve the original dialog for destination selection */}
      <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Destination</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-1 gap-2">
              {isLoadingCountries ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <Button
                    key={country.id}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() =>
                      handleDestinationSelect({
                        id: country.id,
                        name: country.name,
                        type: "country",
                      })
                    }
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{country.name}</span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
