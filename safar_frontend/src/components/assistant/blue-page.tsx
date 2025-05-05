"use client"

import { useState, useRef, useEffect } from "react"
import { useGetPersonalizedBoxMutation } from "@/core/services/api"
import type { Box } from "@/core/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Send, Plane } from "lucide-react"
import { BoxCard } from "../main/box/box-list/box-card"

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  box?: Box
}

export const BluePage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hi there! I'm Blue your travel assistant. Tell me about your dream destination, and I'll create a personalized travel box for you. For example, you can say: 'I want to visit Paris for 5 days in July with a budget of $2000'",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [generateBox, { isLoading }] = useGetPersonalizedBoxMutation()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
  
      const params = extractTravelParams(inputValue, selectedDate)

      if (!params.destination_id || !params.destination_type) {
    
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content:
                "Could you please specify a destination? For example, 'I want to visit Paris' or 'I'm planning a trip to Japan'.",
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
          content: `I've created a personalized travel box for your trip to ${result.name || params.destination_id}! Here are the details:`,
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

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Travel Box Assistant</h1>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            AI Powered
          </Badge>
        </div>
      </header>

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
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
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
                      {message.box && <BoxCard box={message.box} />}
                      <span className="text-xs text-muted-foreground">{format(message.timestamp, "h:mm a")}</span>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary">You</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
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
            <Card>
              <CardContent className="p-3">
                <div className="flex gap-2">
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
                      placeholder="Tell me about your travel plans..."
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
                    {selectedDate && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Badge variant="outline" className="bg-primary/10 flex gap-1 items-center">
                          <CalendarIcon className="h-3 w-3" />
                          {format(selectedDate, "MMM d, yyyy")}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    Try: &quot;I want to visit Paris for 5 days in July with a budget of $2000&quot; or &quot;Plan a family trip to
                    Tokyo&quot;
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
