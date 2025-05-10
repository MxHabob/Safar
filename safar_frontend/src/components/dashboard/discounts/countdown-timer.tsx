"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { CountdownTimerProps } from "./types"

export function CountdownTimer({ expiryDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
    progress: number
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    progress: 100,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const expiry = new Date(expiryDate)
      const difference = expiry.getTime() - now.getTime()

      // Calculate total duration (assuming max 30 days for progress bar)
      const validFrom = new Date(expiry)
      validFrom.setDate(validFrom.getDate() - 30) // Assume 30 days validity
      const totalDuration = expiry.getTime() - validFrom.getTime()
      const elapsed = now.getTime() - validFrom.getTime()
      const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        return {
          days,
          hours,
          minutes,
          seconds,
          total: difference,
          progress,
        }
      } else {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          progress: 100,
        }
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft()
      setTimeLeft(timeLeft)

      if (timeLeft.total <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiryDate])

  if (timeLeft.total <= 0) {
    return null
  }

  // Only show the most significant time unit
  let timeDisplay = ""
  if (timeLeft.days > 0) {
    timeDisplay = `${timeLeft.days} ${timeLeft.days === 1 ? "day" : "days"} left`
  } else if (timeLeft.hours > 0) {
    timeDisplay = `${timeLeft.hours} ${timeLeft.hours === 1 ? "hour" : "hours"} left`
  } else if (timeLeft.minutes > 0) {
    timeDisplay = `${timeLeft.minutes} ${timeLeft.minutes === 1 ? "minute" : "minutes"} left`
  } else {
    timeDisplay = `${timeLeft.seconds} ${timeLeft.seconds === 1 ? "second" : "seconds"} left`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center text-sm">
        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
        <span className="text-muted-foreground">{timeDisplay}</span>
      </div>
      <Progress value={timeLeft.progress} className="h-1" />
    </div>
  )
}
