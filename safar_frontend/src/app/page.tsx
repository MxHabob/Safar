import { ListBox } from "@/components/global/box-list";
import { ListExperience } from "@/components/global/experience-list";
import { ListPlaces } from "@/components/global/place-list";
import { HeaderFilters } from "@/components/section/header/header-filters";
<<<<<<< HEAD
=======
import { Nav } from "@/components/section/header/nav";
>>>>>>> d75e6d7e4dd7f3df43a3bfef4ae6a42436e8cb01
import { MSearch } from "@/components/section/header/Serch";

export default function Home() {
  return (
<<<<<<< HEAD
    <div>
      <MSearch/>
      <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-lg items-center justify-center ">
      <HeaderFilters/>
      </div>
      <div className="px-2 sm:px-6 lg:px-8 md:mx-8 space-y-4">
        <h2 className="text-2xl font-bold my-4 ">picked for you Box</h2>
        <ListBox overlay={false} loop={true} />
        <h2 className="text-2xl font-bold my-4">Featured Experiences</h2>
        <ListExperience overlay={true} loop={true} />
        <h2 className="text-2xl font-bold my-4">Most popular Places</h2>
        <ListPlaces overlay={true} />
        </div>
    </div>
=======
    <main className="w-full min-h-screen flex flex-col gap-8 pb-12">
      <Nav />
      <div className="sticky top-0 z-10 bg-background/50 backdrop-blur-lg items-center pt-4 justify-center overflow-hidden ">
      <MSearch/>
      <HeaderFilters/>
      </div>
      <div className="px-2 sm:px-6 lg:px-8 md:mx-14">
        <h2 className="text-2xl font-bold mb-4 ">picked for you Box</h2>
        <ListBox overlay={false} loop={true} />
      </div>
      <div className="px-2 sm:px-6 lg:px-8 md:mx-14">
        <h2 className="text-2xl font-bold mb-4">Featured Experiences</h2>
        <ListExperience overlay={true} loop={true} />
      </div>
      <div className="px-2 sm:px-6 lg:px-8 md:mx-14">
      <h2 className="text-2xl font-bold mb-4">Most popular Places</h2>
        <ListPlaces overlay={true} />
      </div>
    </main>
>>>>>>> d75e6d7e4dd7f3df43a3bfef4ae6a42436e8cb01
  )
}

