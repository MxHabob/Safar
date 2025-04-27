import AIAssistant from "@/components/global/aI-assistant-feed"
import { HeaderFilters } from "@/components/layout/header/header-filters"
import { MSearch } from "@/components/layout/header/Serch"
import { ListBox } from "@/components/main/box/box-list"
import { ListExperience } from "@/components/main/experience/experience-list"
import { ListPlaces } from "@/components/main/place/place-list"
import { LoadingPlaceholder } from "@/components/ui/loading-placeholder"
import { Suspense } from "react"

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center my-6">
        <h1 className="text-7xl font-bold">Where to?</h1>
      </div>
      <HeaderFilters />
      <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-lg items-center justify-center py-4">
        <MSearch />
      </div>
      <AIAssistant />
      <div className="px-2 sm:px-6 lg:px-8 md:mx-8 space-y-4">
        <h2 className="text-2xl font-bold my-4">Picked for you Box</h2>
        <Suspense fallback={<LoadingPlaceholder count={4} type="box" />}>
          <ListBox overlay={false} loop={true} />
        </Suspense>

        <h2 className="text-2xl font-bold my-4">Featured Experiences</h2>
        <Suspense fallback={<LoadingPlaceholder count={4} type="experience" />}>
          <ListExperience overlay={true} loop={true} />
        </Suspense>

        <h2 className="text-2xl font-bold my-4">Most popular Places</h2>
        <Suspense fallback={<LoadingPlaceholder count={4} type="place" />}>
          <ListPlaces overlay={true} />
        </Suspense>
      </div>
    </div>
  )
}
