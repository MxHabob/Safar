/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useGetPersonalizedBoxMutation, useGetCountriesQuery, useGetCitiesQuery, useGetRegionsQuery } from "@/core/services/api"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format, addDays } from "date-fns"
import { CalendarIcon, Send, Globe, MapPin, Search, Sparkles, Clock, DollarSign, X, Plane, Hotel, Utensils, Camera, Users, Heart, Bookmark, Share2, RefreshCw } from 'lucide-react'
import { BoxCard } from "@/components/main/box/box-list/box-card"
import { UserAvatarDropdownMenu } from "@/components/global/user/user-avatar-dropdown-menu"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  box?: Box
  suggestions?: string[]
}

type DestinationSelection = {
  id: string
  name: string
  type: "city" | "region" | "country"
}

type TravelPreferences = {
  duration: number
  budget: number
  theme: string
  travelers: number
  startDate?: Date
  endDate?: Date
  interests: string[]
}

const THEMES = [
  { value: "adventure", label: "Adventure", icon: <Plane className="h-4 w-4" /> },
  { value: "relaxation", label: "Relaxation", icon: <Hotel className="h-4 w-4" /> },
  { value: "culture", label: "Culture", icon: <Camera className="h-4 w-4" /> },
  { value: "food", label: "Food & Dining", icon: <Utensils className="h-4 w-4" /> },
  { value: "family", label: "Family", icon: <Users className="h-4 w-4" /> },
  { value: "romantic", label: "Romantic", icon: <Heart className="h-4 w-4" /> },
]

const INTERESTS = [
  "Beaches", "Mountains", "Museums", "Shopping", "Nightlife", 
  "Historical Sites", "Local Cuisine", "Outdoor Activities", 
  "Wildlife", "Photography", "Architecture", "Festivals"
]

export default function SunrisePage() {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hi there! I'm Blue, your travel assistant. Where would you like to travel? You can select a destination or tell me about your dream trip.",
      sender: "assistant",
      timestamp: new Date(),
      suggestions: ["I want to visit Paris", "Plan a beach vacation", "Family trip to Japan", "Weekend getaway"]
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // State for destination selection
  const [showDestinationDialog, setShowDestinationDialog] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<DestinationSelection | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [destinationTab, setDestinationTab] = useState("countries")
  
  // State for travel preferences
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false)
  const [preferences, setPreferences] = useState<TravelPreferences>({
    duration: 7,
    budget: 2000,
    theme: "adventure",
    travelers: 2,
    interests: []
  })
  
  // State for saved boxes
  const [savedBoxes, setSavedBoxes] = useState<Box[]>([])
  const [showSavedBoxes, setShowSavedBoxes] = useState(false)
  
  // API hooks
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesQuery({ page_size: 100 })
  const { data: citiesData, isLoading: isLoadingCities } = useGetCitiesQuery(
    { country_id: selectedDestination?.type === "country" ? selectedDestination.id : undefined, page_size: 50 },
    { skip: destinationTab !== "cities" }
  )
  const { data: regionsData, isLoading: isLoadingRegions } = useGetRegionsQuery(
    { country_id: selectedDestination?.type === "country" ? selectedDestination.id : undefined, page_size: 50 },
    { skip: destinationTab !== "regions" }
  )
  const [generateBox, { isLoading }] = useGetPersonalizedBoxMutation()
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Focus input when destination is selected
  useEffect(() => {
    if (selectedDestination) {
      inputRef.current?.focus()
    }
  }, [selectedDestination])
  
  // Filter destinations based on search query
  const filteredDestinations = useMemo(() => {
    if (!searchQuery) {
      if (destinationTab === "countries") return countriesData?.results || []
      if (destinationTab === "cities") return citiesData?.results || []
      if (destinationTab === "regions") return regionsData?.results || []
      return []
    }
    
    const query = searchQuery.toLowerCase()
    if (destinationTab === "countries") {
      return (countriesData?.results || []).filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }
    if (destinationTab === "cities") {
      return (citiesData?.results || []).filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }
    if (destinationTab === "regions") {
      return (regionsData?.results || []).filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }
    return []
  }, [searchQuery, destinationTab, countriesData, citiesData, regionsData])
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedDestination && !preferences.startDate) return

    // Create user message
    let messageContent = inputValue
    if (selectedDestination) {
      messageContent = `I want to visit ${selectedDestination.name}${inputValue ? `: ${inputValue}` : ""}`
    }
    if (preferences.startDate) {
      const dateStr = format(preferences.startDate, "MMMM d, yyyy")
      messageContent += messageContent ? ` starting on ${dateStr}` : `I want to travel on ${dateStr}`
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Prepare parameters for the API call
      let params: any = {
        start_date: preferences.startDate ? format(preferences.startDate, "yyyy-MM-dd") : undefined,
        duration_days: preferences.duration,
        budget: preferences.budget,
        theme: preferences.theme,
        travelers: preferences.travelers,
        interests: preferences.interests.length > 0 ? preferences.interests : undefined,
      }

      // Add destination parameters if available
      if (selectedDestination) {
        params.destination_id = selectedDestination.id
        params.destination_type = selectedDestination.type
      } else {
        // Try to extract destination from message
        const extractedParams = extractTravelParams(userMessage.content)
        params = { ...params, ...extractedParams }
      }

      // If no destination is specified, ask for one
      if (!params.destination_id || !params.destination_type) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              content: "I'd love to help plan your trip! Could you please select a destination using the globe icon?",
              sender: "assistant",
              timestamp: new Date(),
              suggestions: ["Show me popular destinations", "I'm flexible, suggest somewhere"]
            },
          ])
          setIsTyping(false)
        }, 1000)
        return
      }

      // Generate the travel box
      const result = await generateBox(params).unwrap()

      // Add assistant response with the generated box
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `I've created a personalized travel plan for your trip to ${result.name || selectedDestination?.name || "your destination"}! Here are the details:`,
          sender: "assistant",
          timestamp: new Date(),
          box: result,
          suggestions: [
            "Modify this plan", 
            "Show me more options", 
            "Add more activities", 
            `What's the weather like in ${result.name || selectedDestination?.name || "this destination"}?`
          ]
        },
      ])
    } catch (error) {
      console.error("Error generating box:", error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "I'm sorry, I couldn't create a travel plan at the moment. Could you provide more specific details about your trip?",
          sender: "assistant",
          timestamp: new Date(),
          suggestions: ["Try a different destination", "Adjust my preferences", "Start over"]
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Extract travel parameters from message text
  const extractTravelParams = (message: string) => {
    const params: {
      destination_id?: string
      destination_type?: "city" | "region" | "country"
      duration_days?: number
      budget?: number
      theme?: string
      travelers?: number
    } = {}

    // Extract destination
    const cityMatch = message.match(/(?:visit|go to|travel to|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    if (cityMatch && cityMatch[1]) {
      params.destination_id = cityMatch[1]

      // Determine destination type based on common names
      const name = cityMatch[1]
      if (["USA", "UK", "Japan", "France", "Italy", "Spain", "Germany"].includes(name)) {
        params.destination_type = "country"
      } else if (["California", "Tuscany", "Provence", "Bavaria"].includes(name)) {
        params.destination_type = "region"
      } else {
        params.destination_type = "city"
      }
    }

    // Extract duration
    const durationMatch = message.match(/(\d+)\s+(?:days|day|nights|night)/i)
    if (durationMatch && durationMatch[1]) {
      params.duration_days = Number.parseInt(durationMatch[1], 10)
    }

    // Extract budget
    const budgetMatch = message.match(/(?:budget of|spend|cost)\s+\$?(\d+(?:,\d+)?)/i)
    if (budgetMatch && budgetMatch[1]) {
      params.budget = Number.parseInt(budgetMatch[1].replace(",", ""), 10)
    }

    // Extract theme
    const themeKeywords: Record<string, string[]> = {
      adventure: ["adventure", "hiking", "outdoor", "extreme", "adrenaline"],
      relaxation: ["relaxation", "relax", "peaceful", "calm", "spa"],
      culture: ["culture", "museum", "history", "art", "architecture"],
      food: ["food", "culinary", "gastronomy", "dining", "restaurant"],
      romantic: ["romantic", "honeymoon", "couple", "anniversary"],
      family: ["family", "kids", "children", "family-friendly"],
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        params.theme = theme
        break
      }
    }

    // Extract number of travelers
    const travelersMatch = message.match(/(\d+)\s+(?:people|person|travelers|traveler|adults|adult)/i)
    if (travelersMatch && travelersMatch[1]) {
      params.travelers = Number.parseInt(travelersMatch[1], 10)
    }

    return params
  }

  // Handle destination selection
  const handleDestinationSelect = (destination: DestinationSelection) => {
    setSelectedDestination(destination)
    setShowDestinationDialog(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  // Handle saving a box
  const handleSaveBox = (box: Box) => {
    setSavedBoxes(prev => {
      // Check if box is already saved
      if (prev.some(savedBox => savedBox.id === box.id)) {
        return prev
      }
      return [...prev, box]
    })
  }

  // Handle removing a saved box
  const handleRemoveSavedBox = (boxId: string) => {
    setSavedBoxes(prev => prev.filter(box => box.id !== boxId))
  }

  // Handle regenerating a box
  const handleRegenerateBox = async (boxId: string) => {
    // Find the box in messages
    const messageWithBox = messages.find(message => message.box?.id === boxId)
    if (!messageWithBox || !messageWithBox.box) return
    
    setIsTyping(true)
    
    try {
      // Get parameters from the original box
      const destination_id = messageWithBox.box.destination_id || selectedDestination?.id
      const destination_type = messageWithBox.box.destination_type || selectedDestination?.type || "city"

      if (!destination_id || !destination_type) {
        throw new Error("Missing destination_id or destination_type")
      }

      const params = {
        destination_id,
        destination_type,
        duration_days: preferences.duration,
        budget: preferences.budget,
        theme: preferences.theme,
        travelers: preferences.travelers,
        interests: preferences.interests,
        variation: Math.random().toString(36).substring(7)
      }
      
      const result = await generateBox(params).unwrap()
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `I've created an alternative travel plan for your trip to ${result.name || selectedDestination?.name || "your destination"}:`,
          sender: "assistant",
          timestamp: new Date(),
          box: result,
          suggestions: ["Compare with previous plan", "Save this plan", "Further customize this plan"]
        },
      ])
    } catch (error) {
      console.error("Error regenerating box:", error)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "I'm sorry, I couldn't create an alternative plan at the moment. Please try again later.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <main className="flex-1 overflow-hidden container mx-auto p-4">
        <div className="flex flex-col h-full">
          {/* Chat messages area */}
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
                      
                      {/* Box card with action buttons */}
                      {message.box && (
                        <div className="relative">
                          <BoxCard box={message.box} />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                                    onClick={() => handleSaveBox(message.box!)}
                                  >
                                    <Bookmark className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Save this plan</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                                    onClick={() => handleRegenerateBox(message.box!.id)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generate alternative</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Share this plan</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-background/80 backdrop-blur-sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-xs text-muted-foreground">{format(message.timestamp, "h:mm a")}</span>
                    </div>
                    {message.sender === "user" && (
                      <UserAvatarDropdownMenu className="w-9 h-9" />
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
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

          {/* Input area */}
          <div className="mt-4 border-t pt-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex gap-2">
                  {/* Destination selection dialog */}
                  <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn(
                          "shrink-0",
                          selectedDestination && "border-primary text-primary"
                        )}
                      >
                        <Globe className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select a Destination</DialogTitle>
                      </DialogHeader>
                      
                      {/* Search and filter */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search destinations..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Destination type tabs */}
                      <Tabs defaultValue="countries" value={destinationTab} onValueChange={setDestinationTab}>
                        <TabsList className="grid grid-cols-3 mb-4">
                          <TabsTrigger value="countries">Countries</TabsTrigger>
                          <TabsTrigger value="cities">Cities</TabsTrigger>
                          <TabsTrigger value="regions">Regions</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="countries" className="mt-0">
                          <ScrollArea className="h-[300px]">
                            <div className="grid grid-cols-1 gap-2">
                              {isLoadingCountries ? (
                                <div className="flex justify-center items-center h-20">
                                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                                </div>
                              ) : (
                                filteredDestinations.map((country: any) => (
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
                        </TabsContent>
                        
                        <TabsContent value="cities" className="mt-0">
                          <ScrollArea className="h-[300px]">
                            <div className="grid grid-cols-1 gap-2">
                              {isLoadingCities ? (
                                <div className="flex justify-center items-center h-20">
                                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                                </div>
                              ) : filteredDestinations.length > 0 ? (
                                filteredDestinations.map((city: any) => (
                                  <Button
                                    key={city.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3"
                                    onClick={() =>
                                      handleDestinationSelect({
                                        id: city.id,
                                        name: city.name,
                                        type: "city",
                                      })
                                    }
                                  >
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-2" />
                                      <span>{city.name}</span>
                                      {city.country && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {city.country.name}
                                        </Badge>
                                      )}
                                    </div>
                                  </Button>
                                ))
                              ) : (
                                <div className="flex flex-col items-center justify-center h-20 text-center">
                                  <p className="text-muted-foreground">
                                    {selectedDestination?.type === "country" 
                                      ? `No cities found for ${selectedDestination.name}` 
                                      : "Select a country first or search for a city"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="regions" className="mt-0">
                          <ScrollArea className="h-[300px]">
                            <div className="grid grid-cols-1 gap-2">
                              {isLoadingRegions ? (
                                <div className="flex justify-center items-center h-20">
                                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                                </div>
                              ) : filteredDestinations.length > 0 ? (
                                filteredDestinations.map((region: any) => (
                                  <Button
                                    key={region.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3"
                                    onClick={() =>
                                      handleDestinationSelect({
                                        id: region.id,
                                        name: region.name,
                                        type: "region",
                                      })
                                    }
                                  >
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-2" />
                                      <span>{region.name}</span>
                                      {region.country && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {region.country.name}
                                        </Badge>
                                      )}
                                    </div>
                                  </Button>
                                ))
                              ) : (
                                <div className="flex flex-col items-center justify-center h-20 text-center">
                                  <p className="text-muted-foreground">
                                    {selectedDestination?.type === "country" 
                                      ? `No regions found for ${selectedDestination.name}` 
                                      : "Select a country first or search for a region"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  {/* Travel preferences dialog */}
                  <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn(
                          "shrink-0",
                          (preferences.startDate || preferences.interests.length > 0) && "border-primary text-primary"
                        )}
                      >
                        <Sparkles className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Travel Preferences</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-2">
                        {/* Date selection */}
                        <div className="space-y-2">
                          <Label>Travel Dates</Label>
                          <div className="flex gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !preferences.startDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {preferences.startDate ? format(preferences.startDate, "PPP") : "Start date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={preferences.startDate}
                                  onSelect={(date) => {
                                    setPreferences(prev => ({
                                      ...prev,
                                      startDate: date,
                                      endDate: date ? addDays(date, prev.duration) : undefined
                                    }))
                                  }}
                                  initialFocus
                                  disabled={(date) => date < new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            
                            {preferences.startDate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreferences(prev => ({ ...prev, startDate: undefined, endDate: undefined }))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Duration */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Duration</Label>
                            <span className="text-sm text-muted-foreground">{preferences.duration} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[preferences.duration]}
                              min={1}
                              max={30}
                              step={1}
                              onValueChange={(value) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  duration: value[0],
                                  endDate: prev.startDate ? addDays(prev.startDate, value[0]) : undefined
                                }))
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Budget */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Budget</Label>
                            <span className="text-sm text-muted-foreground">${preferences.budget}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[preferences.budget]}
                              min={500}
                              max={10000}
                              step={100}
                              onValueChange={(value) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  budget: value[0]
                                }))
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Theme */}
                        <div className="space-y-2">
                          <Label>Trip Theme</Label>
                          <Select
                            value={preferences.theme}
                            onValueChange={(value) => {
                              setPreferences(prev => ({
                                ...prev,
                                theme: value
                              }))
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                              {THEMES.map(theme => (
                                <SelectItem key={theme.value} value={theme.value}>
                                  <div className="flex items-center">
                                    {theme.icon}
                                    <span className="ml-2">{theme.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Travelers */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Travelers</Label>
                            <span className="text-sm text-muted-foreground">{preferences.travelers} {preferences.travelers === 1 ? 'person' : 'people'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[preferences.travelers]}
                              min={1}
                              max={10}
                              step={1}
                              onValueChange={(value) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  travelers: value[0]
                                }))
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Interests */}
                        <div className="space-y-2">
                          <Label>Interests</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {INTERESTS.map(interest => (
                              <div key={interest} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`interest-${interest}`} 
                                  checked={preferences.interests.includes(interest)}
                                  onCheckedChange={(checked) => {
                                    setPreferences(prev => ({
                                      ...prev,
                                      interests: checked 
                                        ? [...prev.interests, interest]
                                        : prev.interests.filter(i => i !== interest)
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`interest-${interest}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {interest}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Saved boxes dialog */}
                  <Dialog open={showSavedBoxes} onOpenChange={setShowSavedBoxes}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn(
                          "shrink-0",
                          savedBoxes.length > 0 && "border-primary text-primary"
                        )}
                      >
                        <Bookmark className="h-5 w-5" />
                        {savedBoxes.length > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {savedBoxes.length}
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Saved Travel Plans</DialogTitle>
                      </DialogHeader>
                      
                      {savedBoxes.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {savedBoxes.map(box => (
                              <div key={box.id} className="relative">
                                <BoxCard box={box} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80"
                                  onClick={() => handleRemoveSavedBox(box.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">You haven&apos;t saved any travel plans yet.</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            When you find a plan you like, click the bookmark icon to save it here.
                          </p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Date selection popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn(
                          "shrink-0",
                          preferences.startDate && "border-primary text-primary"
                        )}
                      >
                        <CalendarIcon className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={preferences.startDate}
                        onSelect={(date) => {
                          setPreferences(prev => ({
                            ...prev,
                            startDate: date,
                            endDate: date ? addDays(date, prev.duration) : undefined
                          }))
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Input field */}
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
                      className="pr-24"
                      disabled={isLoading}
                    />
                    
                    {/* Active filters display */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 max-w-[200px] overflow-x-auto no-scrollbar">
                      {selectedDestination && (
                        <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{selectedDestination.name}</span>
                        </Badge>
                      )}
                      {preferences.startDate && (
                        <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                          <CalendarIcon className="h-3 w-3" />
                          <span className="truncate">{format(preferences.startDate, "MMM d")}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Send button */}
                  <Button
                    type="submit"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && !selectedDestination && !preferences.startDate) || isLoading}
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* Helper text */}
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    {selectedDestination
                      ? `Planning a trip to ${selectedDestination.name}? Try adding details like "5 days with a budget of $2000" or use the preferences button.`
                      : "Click the globe icon to select a destination, or type your travel plans. Use the sparkles icon to set detailed preferences."}
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
