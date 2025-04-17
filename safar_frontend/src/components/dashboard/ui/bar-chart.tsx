"use client"

interface BarChartProps {
  heights: number[]
}

export function BarChart({ heights }: BarChartProps) {
  return (
    <div className="flex h-[40px] items-end gap-1">
      {heights.map((height, index) => (
        <div key={index} className="w-2 bg-primary rounded-t-sm" style={{ height: `${height}px` }} />
      ))}
    </div>
  )
}
