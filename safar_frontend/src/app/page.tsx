import { ListExperience } from "@/components/global/experience-list";
import { ListPlaces } from "@/components/global/place-list";
import { Header } from "@/components/section/header";

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-8 pb-12">
      <Header />
      <div className="px-2 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-4">Featured Experiences</h2>
        <ListExperience overlay={true} loop={true} />
      </div>
      <div className=" mx-auto md:mx-4 ">
        <ListPlaces overlay={true} />
      </div>
    </main>
  )
}

