"use client"
import Link from "next/link"
import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "../slider"
import { useGetExperiencesQuery } from "@/redux/services/api"
import { ExperienceCard } from "./experience-card"

type Props = {
  overlay?: boolean
  selected?: string
  favorites?: string[]
  onFavoriteToggle?: (id: string) => void
} & SwiperProps

export const ListExperience = ({ overlay, selected, favorites = [], onFavoriteToggle, ...rest }: Props) => {
  const { data: experiences, isLoading, error } = useGetExperiencesQuery({})

  console.log("experiences : ",experiences )

  const isExperienceFavorited = (experienceId: string) => {
    return favorites.includes(experienceId)
  }

  const handleFavorite = (id: string) => {
    if (onFavoriteToggle) {
      onFavoriteToggle(id)
    }
  }


  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading experiences. Please try again later.</p>
      </div>
    )
  }


  return (
    <Slider
      slidesPerView="auto"
      spaceBetween={16}
      loop={(experiences?.count ?? 0) > 3}
      freeMode
      overlay={overlay}
      {...rest}
    >
       {(experiences?.count ?? 0) > 0 ? (
        experiences?.results.map((experience) => (
        <SwiperSlide
          key={experience.id}
          className={`content-width-slide transition-all duration-200 ${
            selected === experience.id ? "scale-[1.02]" : ""
          }`}
        >
          <Link href={`/experience/${experience.id}`}>
            <ExperienceCard
              experience={experience}
              onFavorite={handleFavorite}
              isFavorited={isExperienceFavorited(experience.id)}
            />
          </Link>
          
        </SwiperSlide>
      ))
       ) : !isLoading ? (
                <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
                  <p>No places found.</p>
                </div>
              ) : null}
      
              {isLoading && (
                <div className="flex justify-center p-6 col-span-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-12 w-full overflow-x-auto pb-4">
                  <ExperienceCard.Skeleton />
                  <ExperienceCard.Skeleton />
                  <ExperienceCard.Skeleton />
                  <ExperienceCard.Skeleton />
                  </div>
                </div>
              )}
    </Slider>
  )
}

