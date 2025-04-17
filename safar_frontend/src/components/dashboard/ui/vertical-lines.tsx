"use client"

interface VerticalLinesProps {
  count: number
}

export function VerticalLines({ count }: VerticalLinesProps) {
  return (
    <div className="flex h-[40px] items-center justify-between px-2 w-24">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-[1px] bg-muted-foreground/30 h-full" />
      ))}
    </div>
  )
}
