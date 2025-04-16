"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface StatusCircleProps {
  value: number
  maxValue: number
  className?: string
}

export function StatusCircle({ value, maxValue, className }: StatusCircleProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <div className="h-32 w-32 rounded-full border-4 border-dashed border-primary/30"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{value}</span>
        </div>
      </div>
    )
  }

  const percentage = (value / maxValue) * 100
  const circumference = 2 * Math.PI * 58 // 58 is the radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg className="h-32 w-32 -rotate-90 transform">
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          className="text-primary/10"
        />
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold">{value}</span>
      </div>
    </div>
  )
}
