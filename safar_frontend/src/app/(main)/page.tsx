import AIAssistant from "@/components/global/aI-assistant-feed"
import { HeaderFilters } from "@/components/layout/header/header-filters"
import { ListBox } from "@/components/main/box/box-list"
import { ListExperience } from "@/components/main/experience/experience-list"
import { ListPlaces } from "@/components/main/place/place-list"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { CommandMenu } from "@/components/main/search/search-menu"

export default async function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center my-6">
        <h1 className="text-7xl font-bold">Where to?</h1>
      </div>
      <HeaderFilters />
      <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-lg items-center justify-center py-4">
        <CommandMenu />
      </div>
      <AIAssistant />
      <div className="px-2 sm:px-6 lg:px-8 md:mx-8 space-y-4">
          <ListBox overlay={false} loop={true} />
        <div className="flex justify-between items-center my-4">
          <h2 className="text-2xl font-bold">Featured Experiences</h2>
          <Link href="/experiences">
            <Button variant="ghost" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
          <ListExperience overlay={true} loop={true} />
        <div className="flex justify-between items-center my-4">
          <h2 className="text-2xl font-bold">Most popular Places</h2>
          <Link href="/places">
            <Button variant="ghost" className="flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
          <ListPlaces overlay={true} />
      </div>
    </div>
  )
}