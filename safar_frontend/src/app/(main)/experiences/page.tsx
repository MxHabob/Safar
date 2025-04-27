import { RouterBack } from "@/components/global/router-back"
import { ListExperience } from "@/components/main/experience/experience-list"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ExperiencesPage() {

  return (
   <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <RouterBack/>
      </div>
      <div className="flex flex-col items-center justify-center my-6">
        <h1 className="text-4xl font-bold">Experiences</h1>
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
  )
}