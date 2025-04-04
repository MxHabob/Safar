import { ListBox } from "@/components/global/box-list";
import { ListExperience } from "@/components/global/experience-list";
import { ListPlaces } from "@/components/global/place-list";
import { HeaderFilters } from "@/components/section/header/header-filters";
import { MSearch } from "@/components/section/header/Serch";

export default function Home() {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-lg items-center pt-4 justify-center overflow-hidden ">
      <MSearch/>
      <HeaderFilters/>
      </div>
      <div className="px-2 sm:px-6 lg:px-8 md:mx-8 space-y-4">
        <h2 className="text-2xl font-bold mb-4 ">picked for you Box</h2>
        <ListBox overlay={false} loop={true} />
        <h2 className="text-2xl font-bold mb-4">Featured Experiences</h2>
        <ListExperience overlay={true} loop={true} />
        <h2 className="text-2xl font-bold mb-4">Most popular Places</h2>
        <ListPlaces overlay={true} />
        </div>
    </div>
  )
}

