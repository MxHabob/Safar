import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ListPlaces } from "@/components/main/place/place-list"

export default function PlacesPage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Explore Places</h1>
          <p className="text-muted-foreground">
            Discover amazing locations around you
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search places..."
            className="pl-10"/>
        </div>
        <ListPlaces />
      </div>
    </div>
  )
}