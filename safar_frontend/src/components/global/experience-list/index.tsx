"use client"
import Link from "next/link"
import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "../slider"
import ExperienceCard from "./experience-card"
import { useGetExperiencesQuery } from "@/redux/services/api"
import { Loader2 } from "lucide-react"

type Props = {
  overlay?: boolean
  selected?: string
  favorites?: string[]
  onFavoriteToggle?: (id: string) => void
} & SwiperProps

export const ListExperience = ({ overlay, selected, favorites = [], onFavoriteToggle, ...rest }: Props) => {
  const { data: experiences, isLoading, error } = useGetExperiencesQuery({})

  // Check if a experience is in favorites
  const isExperienceFavorited = (experienceId: string) => {
    return favorites.includes(experienceId)
  }

  // Handle favorite toggle
  const handleFavorite = (id: string) => {
    if (onFavoriteToggle) {
      onFavoriteToggle(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading experiences...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading experiences. Please try again later.</p>
      </div>
    )
  }

  if (!experiences?.results || experiences.results.length === 0) {
    return (
      <div className="flex justify-center items-center py-8 text-gray-500">
        <p>No experiences found.</p>
      </div>
    )
  }

  return (
    <Slider
      slidesPerView="auto"
      spaceBetween={16}
      loop={experiences.results.length > 3}
      freeMode
      overlay={overlay}
      {...rest}
    >
      {experiences.results.map((experience) => (
        <SwiperSlide
          key={experience.id}
          className={`content-width-slide transition-all duration-200 ${
            selected === experience.id ? "scale-[1.02]" : ""
          }`}
        >
          <Link href={`/?${experience.id}`}>
            <ExperienceCard
              experience={experience}
              onFavorite={handleFavorite}
              isFavorited={isExperienceFavorited(experience.id)}
            />
          </Link>
        </SwiperSlide>
      ))}
    </Slider>
  )
}

