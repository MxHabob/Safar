import { RouterBack } from "@/components/global/router-back"
import { ListExperience } from "@/components/main/experience/experience-list"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ExperiencesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col gap-6">
        <div>
          <RouterBack />
        </div>
        
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Experiences</h1>
          <p className="text-muted-foreground max-w-prose">
            Find unique activities and adventures
          </p>
        </div>
      </header>
      <section aria-label="Search experiences" className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search experiences..."
            className="pl-10 w-full"
            aria-label="Search experiences input"
          />
        </div>
      </section>
      <section aria-label="Experiences list">
        <ListExperience />
      </section>
    </div>
  )
}