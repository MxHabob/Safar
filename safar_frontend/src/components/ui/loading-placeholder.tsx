import { Skeleton } from "@/components/ui/skeleton"

type LoadingPlaceholderProps = {
  count: number
  type: "box" | "experience" | "place"
}

export function LoadingPlaceholder({ count, type }: LoadingPlaceholderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((i) => (
        <div key={i} className="w-full">
          <Skeleton className="w-full aspect-[4/3] rounded-lg" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            {type === "place" && <Skeleton className="h-4 w-1/4 mt-1" />}
          </div>
        </div>
      ))}
    </div>
  )
}
