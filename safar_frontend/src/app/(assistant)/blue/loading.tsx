import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto p-4">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-4 pb-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-64 rounded-lg" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}
