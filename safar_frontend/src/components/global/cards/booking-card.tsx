"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Minus, Plus, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Box, Experience, Place } from "@/redux/types/types"

export interface BookingCardProps {
  id: string
  data: Experience | Place | Box
  placeType: "experience" | "box" | "place"
}

export default function BookingCard({ id, data, placeType }: BookingCardProps) {
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const [groupSize, setGroupSize] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate number of nights (if applicable)
  const nights = date.from && date.to ? Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) : 0

  // Get price based on place type
  const getBasePrice = () => {
    if (placeType === "experience") {
      return (data as Experience).price_per_person || 0
    } else if (placeType === "place") {
      return (data as Place).price || 0
    } else if (placeType === "box") {
      return (data as Box).total_price || 0
    }
    return 0
  }

  // Get currency based on place type
  const getCurrency = () => {
    return data.currency || "USD"
  }

  // Calculate total price
  const basePrice = getBasePrice()
  const totalPrice = placeType === "experience" ? basePrice * groupSize * (nights || 1) : basePrice * (nights || 1)

  const handleReserve = async () => {
    if (!date.from || !date.to) {
      toast.error("Please select check-in and check-out dates")
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would make an API call to create the booking
      const bookingData = {
        [placeType]: id,
        check_in: format(date.from, "yyyy-MM-dd"),
        check_out: format(date.to, "yyyy-MM-dd"),
        booking_date: new Date().toISOString(),
        status: "Pending",
        total_price: totalPrice,
        currency: getCurrency(),
        payment_status: "Pending",
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(`Your ${placeType} has been reserved!`, {
        description: `Check-in: ${format(date.from, "PPP")} - Check-out: ${format(date.to, "PPP")}`,
      })

      console.log("Booking created:", bookingData)
      // Reset form or redirect
      // window.location.href = `/bookings/${bookingId}`
    } catch (error) {
      toast.error("Failed to complete your reservation. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const incrementGroupSize = () => {
    const maxSize =
      placeType === "experience"
        ? (data as Experience).capacity || 10
        : placeType === "box"
          ? (data as Box).max_group_size || 10
          : 10

    setGroupSize((prev) => Math.min(prev + 1, maxSize))
  }

  const decrementGroupSize = () => {
    setGroupSize((prev) => Math.max(prev - 1, 1)) // Minimum 1 person
  }

  // Get title based on place type
  const getTitle = () => {
    if (placeType === "experience") {
      return (data as Experience).title
    } else if (placeType === "place") {
      return (data as Place).name
    } else if (placeType === "box") {
      return (data as Box).name
    }
    return ""
  }

  // Get rating based on place type
  const getRating = () => {
    if (placeType === "experience" || placeType === "place") {
      if (placeType === "experience" || placeType === "place") {
        return (data as Experience | Place).rating || 0
      }
      return 0
    }
    return null
  }

  return (
    <Card className="w-full max-w-md sticky top-6 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">
            {getBasePrice()} {getCurrency()}
            {placeType === "experience" && <span className="text-sm font-normal text-muted-foreground"> / person</span>}
            {placeType !== "experience" && <span className="text-sm font-normal text-muted-foreground"> / night</span>}
          </div>
          {getRating() !== null && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{getRating()}</span>
            </div>
          )}
        </div>
        <div className="text-sm font-medium">{getTitle()}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Picker */}
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date.from && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(date.from, "MMM d, yyyy")
                  )
                ) : (
                  "Select dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date.from}
                selected={date}
                onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Group Size - Only show for experiences and boxes */}
        {(placeType === "experience" || placeType === "box") && (
          <div className="space-y-2">
            <div className="font-medium">Guests</div>
            <div className="flex items-center justify-between">
              <span>Number of guests</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={decrementGroupSize}
                  disabled={groupSize <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-4 text-center">{groupSize}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={incrementGroupSize}
                  disabled={
                    placeType === "experience"
                      ? groupSize >= ((data as Experience).capacity || 10)
                      : placeType === "box"
                        ? groupSize >= ((data as Box).max_group_size || 10)
                        : groupSize >= 10
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            {placeType === "experience" ? (
              <span>
                {getBasePrice()} {getCurrency()} x {groupSize} {groupSize === 1 ? "guest" : "guests"}
                {nights > 0 ? ` x ${nights} ${nights === 1 ? "night" : "nights"}` : ""}
              </span>
            ) : (
              <span>
                {getBasePrice()} {getCurrency()}
                {nights > 0 ? ` x ${nights} ${nights === 1 ? "night" : "nights"}` : ""}
              </span>
            )}
            <span>
              {totalPrice} {getCurrency()}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Service fee</span>
            <span>
              {Math.round(totalPrice * 0.1)} {getCurrency()}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              {Math.round(totalPrice * 1.1)} {getCurrency()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full" onClick={handleReserve} disabled={!date.from || !date.to || isSubmitting}>
          {isSubmitting ? "Processing..." : "Reserve"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">You won&apos;t be charged yet</div>
      </CardFooter>
    </Card>
  )
}
