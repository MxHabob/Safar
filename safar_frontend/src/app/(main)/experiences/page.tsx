import { ListExperience } from "@/components/main/experience/experience-list"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ExperiencesPage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Discover Experiences</h1>
          <p className="text-muted-foreground">
            Find unique activities and adventures
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experiences..."
            className="pl-10"
          />
        </div>
        <div className="relative">
          <ListExperience  />
        </div>
      </div>
    </div>
  )
}