"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils/date-formatter"
import { toast } from "sonner"

// Mock events data - replace with actual API call
const mockEvents = [
  {
    id: "1",
    title: "City Tour",
    date: new Date(),
    startTime: "10:00",
    endTime: "12:00",
    location: "City Center",
    available: true,
  },
  {
    id: "2",
    title: "Wine Tasting",
    date: new Date(Date.now() + 86400000), // Tomorrow
    startTime: "15:00",
    endTime: "17:00",
    location: "Vineyard Valley",
    available: true,
  },
  {
    id: "3",
    title: "Cooking Class",
    date: new Date(Date.now() + 172800000), // Day after tomorrow
    startTime: "18:00",
    endTime: "20:00",
    location: "Culinary Institute",
    available: false,
  },
]

export default function EventsModal() {
  const dispatch = useDispatch()
  const { isOpen, type } = useSelector((state: RootState) => state.modal)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "Events"

  const onClose = () => {
    dispatch(closeModal())
  }

  const filteredEvents = mockEvents.filter(
    (event) => selectedDate && event.date.toDateString() === selectedDate.toDateString(),
  )

  const handleBookEvent = async (eventId: string) => {
    setIsLoading(true)

    try {
      // Replace with actual booking API call
      await toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
        loading: "Booking event...",
        success: "Event booked successfully!",
        error: "Failed to book event",
      })
      onClose()
    } catch (error) {
      console.error("Error booking event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title="Available Events"
      description="Browse and book available events"
      isOpen={isModalOpen}
      onClose={onClose}
      className="sm:max-w-xl"
    >
      <Tabs defaultValue="calendar" className="py-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Events on {selectedDate ? formatDate(selectedDate) : "selected date"}
            </h3>

            {filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events available on this date.</p>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge variant={event.available ? "default" : "outline"}>
                        {event.available ? "Available" : "Fully Booked"}
                      </Badge>
                    </div>

                    <div className="mt-2 grid gap-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {event.location}
                      </div>
                    </div>

                    {event.available && (
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => handleBookEvent(event.id)}
                        disabled={isLoading}
                      >
                        Book Now
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {mockEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events available.</p>
            ) : (
              mockEvents.map((event) => (
                <div key={event.id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge variant={event.available ? "default" : "outline"}>
                      {event.available ? "Available" : "Fully Booked"}
                    </Badge>
                  </div>

                  <div className="mt-2 grid gap-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      {event.location}
                    </div>
                  </div>

                  {event.available && (
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      onClick={() => handleBookEvent(event.id)}
                      disabled={isLoading}
                    >
                      Book Now
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  )
}
