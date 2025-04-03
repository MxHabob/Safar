"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStartDate?: Date
  initialEndDate?: Date
  location?: string
  onDateChange?: (startDate: Date | null, endDate: Date | null) => void
}

export function DatePicker({
  initialStartDate,
  initialEndDate,
  location,
  onDateChange,
  className,
  ...props
}: DatePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null)
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate calendar days for current month view
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false })
    }

    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isSelected: isDateSelected(currentDate),
        isInRange: isDateInRange(currentDate),
        isToday: isToday(currentDate),
      })
    }

    return days
  }

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false

    return (
      (startDate && date.toDateString() === startDate.toDateString()) ||
      (endDate && date.toDateString() === endDate.toDateString())
    )
  }

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false

    return date > startDate && date < endDate
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date)
      setEndDate(null)
    } else {
      // Complete selection
      if (date < startDate) {
        setEndDate(startDate)
        setStartDate(date)
      } else {
        setEndDate(date)
      }
    }

    if (onDateChange) {
      if (!startDate || (startDate && endDate)) {
        onDateChange(date, null)
      } else {
        if (date < startDate) {
          onDateChange(date, startDate)
        } else {
          onDateChange(startDate, date)
        }
      }
    }
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getDuration = () => {
    if (!startDate || !endDate) return ""

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return `${diffDays} ${diffDays === 1 ? "night" : "nights"}`
  }

  const days = generateCalendarDays(currentMonth)
  const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

  return (
    <div className={cn("w-full", className)} {...props}>
      {(location || (startDate && endDate)) && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {getDuration()} {location ? `in ${location}` : ""}
          </h2>
          {startDate && endDate && (
            <p className="mt-1 text-gray-600">
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-1">
          <ChevronRight className="h-5 w-5 transform rotate-180" />
        </button>

        <div className="grid grid-cols-2 gap-16">
          <div className="text-center">
            <h3 className="font-medium">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
          </div>
          <div className="text-center">
            <h3 className="font-medium">
              {nextMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
          </div>
        </div>

        <button onClick={nextMonth} className="p-1">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-16">
        {/* Current Month Calendar */}
        <div>
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
              <div key={i} className="text-center text-sm text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <div key={i} className="aspect-square p-1">
                {day.date ? (
                  <button
                    onClick={() => handleDateClick(day.date as Date)}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full text-sm",
                      day.isToday && "font-medium",
                      day.isSelected && "bg-black text-white",
                      day.isInRange && "bg-gray-100",
                      !day.isCurrentMonth && "text-gray-300",
                    )}
                  >
                    {day.date.getDate()}
                  </button>
                ) : (
                  <div className="h-full w-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next Month Calendar */}
        <div>
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
              <div key={i} className="text-center text-sm text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays(nextMonthDate).map((day, i) => (
              <div key={i} className="aspect-square p-1">
                {day.date ? (
                  <button
                    onClick={() => handleDateClick(day.date as Date)}
                    className={cn(
                      "flex h-full w-full items-center justify-center rounded-full text-sm",
                      day.isToday && "font-medium",
                      day.isSelected && "bg-black text-white",
                      day.isInRange && "bg-gray-100",
                      !day.isCurrentMonth && "text-gray-300",
                    )}
                  >
                    {day.date.getDate()}
                  </button>
                ) : (
                  <div className="h-full w-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setStartDate(null)
            setEndDate(null)
            if (onDateChange) onDateChange(null, null)
          }}
        >
          Clear dates
        </Button>
      </div>
    </div>
  )
}

