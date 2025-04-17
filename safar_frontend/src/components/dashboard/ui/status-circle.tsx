"use client"

interface StatusCircleProps {
  value: number
  maxValue: number
}

export function StatusCircle({ value, maxValue }: StatusCircleProps) {
  const percentage = (value / maxValue) * 100
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-44 w-44 -rotate-90 transform">
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="5"
          className="text-primary/10"
        />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold">{value}</span>
      </div>
    </div>
  )
}
