"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useGetPersonalizedBoxMutation, useGetCountriesQuery } from "@/core/services/api"
import type { Box } from "@/core/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  CalendarIcon,
  Send,
  Globe,
  MapPin,
  Search,
  Sparkles,
  Clock,
  DollarSign,
  Mountain,
  Utensils,
  Landmark,
  Heart,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { BoxCard } from "../main/box/box-list/box-card"
import { UserAvatar } from "../global/user-avatar"

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

type TravelTheme = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

export const BluePage = () => {
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
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [durationDays, setDurationDays] = useState<number | null>(null)
  const [budget, setBudget] = useState<number | null>(null)

  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesQuery({ page_size: 100 })
  const [generateBox, { isLoading }] = useGetPersonalizedBoxMutation()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const travelThemes: TravelTheme[] = [
    {
      id: "adventure",
      name: "Adventure",
      icon: <Mountain className="h-4 w-4" />,
      description: "Hiking, outdoor activities, and adrenaline-pumping experiences",
    },
    {
      id: "relaxation",
      name: "Relaxation",
      icon: <Sparkles className="h-4 w-4" />,
      description: "Peaceful getaways, spas, and tranquil environments",
    },
    {
      id: "culture",
      name: "Culture",
      icon: <Landmark className="h-4 w-4" />,
      description: "Museums, historical sites, and local traditions",
    },
    {
      id: "food",
      name: "Food",
      icon: <Utensils className="h-4 w-4" />,
      description: "Culinary experiences, local cuisine, and food tours",
    },
    {
      id: "romantic",
      name: "Romantic",
      icon: <Heart className="h-4 w-4" />,
      description: "Perfect for couples, honeymoons, and anniversaries",
    },
    {
      id: "family",
      name: "Family",
      icon: <Users className="h-4 w-4" />,
      description: "Kid-friendly activities and family accommodations",
    },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when destination is selected
  useEffect(() => {
    if (selectedDestination && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedDestination])

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedDestination) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: selectedDestination
        ? `I want to visit ${selectedDestination.name}${inputValue ? `: ${inputValue}` : ""}${
            selectedTheme ? ` for a ${selectedTheme} experience` : ""
          }${durationDays ? ` for ${durationDays} days` : ""}${budget ? ` with a budget of $${budget}` : ""}`
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
        theme: selectedTheme || undefined,
        duration_days: durationDays || undefined,
        budget: budget || undefined,
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

      // Show success toast with Sonner
      toast.success("Travel Box Created!", {
        description: `Your personalized travel plan for ${result.name || selectedDestination?.name || params.destination_id} is ready.`,
        icon: <CheckCircle className="h-4 w-4" />,
      })
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

      // Show error toast with Sonner
      toast.error("Error", {
        description: "Could not generate travel recommendations. Please try again.",
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setIsTyping(false)
      // Keep the destination selected for follow-up questions
      // but reset the other parameters
      setSelectedDate(undefined)
      setSelectedTheme(null)
      setDurationDays(null)
      setBudget(null)
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

    // Show a toast notification with Sonner
    toast.success("Destination Selected", {
      description: `${destination.name} has been selected. Now you can add more details to your trip.`,
      icon: <MapPin className="h-4 w-4" />,
    })
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
  }

  const handleClearSelections = () => {
    setSelectedDestination(null)
    setSelectedDate(undefined)
    setSelectedTheme(null)
    setDurationDays(null)
    setBudget(null)

    toast("Selections Cleared", {
      description: "All travel preferences have been reset.",
    })
  }

  const filteredCountries =
    countriesData?.results.filter(
      (country) => !searchQuery || country.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <main className="flex-1 overflow-hidden container mx-auto p-4">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-4 pb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex gap-3 max-w-[80%]">
                    {message.sender === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/assistant-avatar.png" alt="AI Assistant" />
                        <AvatarFallback className="bg-primary text-primary-foreground">Bl</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      {message.box && (
                        <div className="mt-2 animate-fadeIn">
                          <BoxCard box={message.box} />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{format(message.timestamp, "h:mm a")}</span>
                    </div>
                    {message.sender === "user" && <UserAvatar className="w-9 h-9" />}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">Bl</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <Card className="shadow-sm">
              <CardContent className="p-3">
                {selectedDestination && (
                  <div className="mb-3 flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                      <MapPin className="h-3 w-3" />
                      {selectedDestination.name}
                    </Badge>

                    {selectedDate && (
                      <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                        <CalendarIcon className="h-3 w-3" />
                        {format(selectedDate, "MMM d, yyyy")}
                      </Badge>
                    )}

                    {selectedTheme && (
                      <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                        {travelThemes.find((t) => t.id === selectedTheme)?.icon}
                        {travelThemes.find((t) => t.id === selectedTheme)?.name}
                      </Badge>
                    )}

                    {durationDays && (
                      <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                        <Clock className="h-3 w-3" />
                        {durationDays} days
                      </Badge>
                    )}

                    {budget && (
                      <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                        <DollarSign className="h-3 w-3" />${budget}
                      </Badge>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleClearSelections} className="ml-auto h-7 text-xs">
                      Clear All
                    </Button>
                  </div>
                )}

                <Tabs defaultValue="message" className="mb-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="message">Message</TabsTrigger>
                    <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="message" className="mt-2">
                    <div className="flex gap-2">
                      <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0">
                            <Globe className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
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

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0">
                            <CalendarIcon className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="relative flex-1">
                        <Input
                          ref={inputRef}
                          placeholder={
                            selectedDestination
                              ? `Tell me about your trip to ${selectedDestination.name}...`
                              : "Tell me about your travel plans or select a destination..."
                          }
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          className="pr-10"
                          disabled={isLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={(!inputValue.trim() && !selectedDestination) || isLoading}
                        className="shrink-0"
                      >
                        {isLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="mt-2 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Travel Theme</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {travelThemes.map((theme) => (
                          <Button
                            key={theme.id}
                            variant={selectedTheme === theme.id ? "default" : "outline"}
                            size="sm"
                            className="justify-start h-auto py-2"
                            onClick={() => handleThemeSelect(theme.id)}
                          >
                            <div className="flex items-center">
                              {theme.icon}
                              <span className="ml-2">{theme.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Duration (days)</h4>
                        <div className="flex gap-2">
                          {[3, 5, 7, 10, 14].map((days) => (
                            <Button
                              key={days}
                              variant={durationDays === days ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDurationDays(days)}
                            >
                              {days}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Budget ($)</h4>
                        <div className="flex gap-2">
                          {[1000, 2000, 3000, 5000, 10000].map((amount) => (
                            <Button
                              key={amount}
                              variant={budget === amount ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBudget(amount)}
                            >
                              {amount}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    {selectedDestination
                      ? `Planning a trip to ${selectedDestination.name}? Try adding details like "5 days with a budget of $2000"`
                      : "Click the globe icon to select a destination, or type your travel plans"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
