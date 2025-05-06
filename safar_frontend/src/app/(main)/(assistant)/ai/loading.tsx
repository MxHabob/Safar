import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      <main className="flex-1 overflow-hidden container mx-auto p-4">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-4 pb-4">
            <div className="space-y-4">
              {/* Assistant message loading state */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <Skeleton className="h-full w-full rounded-full" />
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-24 w-64 rounded-lg" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>

              {/* User message loading state */}
              <div className="flex justify-end">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-16 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>

              {/* Assistant typing indicator */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <Skeleton className="h-full w-full rounded-full" />
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="rounded-lg p-3 bg-muted">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional assistant message loading state */}
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <Skeleton className="h-full w-full rounded-full" />
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-20 w-64 rounded-lg" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input area loading state */}
          <div className="mt-4 border-t pt-4">
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <Tabs defaultValue="message" className="mb-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="message">
                      <Skeleton className="h-4 w-16" />
                    </TabsTrigger>
                    <TabsTrigger value="preferences">
                      <Skeleton className="h-4 w-24" />
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <Skeleton className="flex-1 h-10 rounded-md" />
                      <Skeleton className="h-10 w-10 rounded-md" />
                    </div>
                  </div>
                </Tabs>

                <div className="mt-2">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
