import { Search} from "lucide-react"
import { Button } from "@/components/ui/button"

export function MSearch() {
  return (
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center rounded-full bg-card shadow-lg">
            <div className="flex-1 px-6 py-3">
              <div className="text-sm font-medium">Where</div>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full border-none p-0 text-sm focus:outline-none focus:ring-0"
              />
            </div>
            <Button className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full ">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
  )
}

