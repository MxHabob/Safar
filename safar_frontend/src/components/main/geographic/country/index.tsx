"use client";
import { BreadcrumbWithDropdown } from "@/components/global/breadcrumb-with-dropdown"
import { useGetCountryQuery } from "@/core/services/api"
import Image from "next/image"
import { ListCities } from "../city/city-list/city-list";
import { ListPlaces } from "../../place/place-list";
import { Skeleton } from "@/components/ui/skeleton";


export const CountriesPageContent = ({id}:{id:string}) => {
    const {data ,error,isLoading } = useGetCountryQuery(id)

  if (isLoading) {
    return (
      <CountriesPageContent.Skeleton/>
    )
  }
  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading data. Please try again later.</p>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-2 flex justify-between text-xs">
        <BreadcrumbWithDropdown
            items={[{ label: "Home", href: "/" }, { label: "countries", href: "/countries" }, { label: `${data?.name}` }]}
          />
        </div>
     
      <main className="flex-1">
        <div className="py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">What you need to know</h1>
          {isLoading ? <Skeleton /> : <h2 className="text-5xl md:text-7xl font-bold">{data?.name || ""}</h2>}
        </div>
        <div className="container mx-auto px-4 pb-8">
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full overflow-hidden rounded-t-xl">
            <Image
              src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/c9/6c/08/caption.jpg?w=1200&h=-1&s=1"
              alt="Rome architecture"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
          <ListCities/>
          <ListPlaces country={id}/>
          </div>
        </div>
      </main>
    </div>
  )
}

CountriesPageContent.Skeleton = function CountriesPageContentSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-2 flex justify-between text-xs">
        <Skeleton className="h-5 w-60 rounded-full" />
        </div>
     
      <main className="flex-1">
        <div className="py-16 text-center m-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">What you need to know</h1>
          <Skeleton className="w-96 h-16" />
        </div>
        <div className="container mx-auto px-4 pb-8">
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full overflow-hidden rounded-t-xl">
            <Image
              src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/c9/6c/08/caption.jpg?w=1200&h=-1&s=1"
              alt="Rome architecture"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
          <ListCities/>
          <ListPlaces/>
          </div>
        </div>
      </main>
    </div>
)
}