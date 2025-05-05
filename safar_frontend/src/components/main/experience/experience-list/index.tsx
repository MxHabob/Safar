"use client"

import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "@/components/global/slider"
import { useGetRecommendedExperiencesQuery } from "@/core/services/api"
import { ExperienceCard } from "./experience-card"
import type { Experience } from "@/core/types"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListExperience = ({ overlay, selected, ...rest }: Props) => {
  const {
    data: experiences,
    isLoading,
    error,
  } = useGetRecommendedExperiencesQuery({ 
  limit: 5
},{ refetchOnMountOrArgChange: false })

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading experiences. Please try again later.</p>
      </div>
    )
  }

   console.log("experiences : ", experiences)
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
        experiences?.results.map((experience: Experience) => (
          <SwiperSlide
            key={experience.id}
            className={`content-width-slide transition-all duration-200 ${
              selected === experience.id ? "scale-[1.02]" : ""
            }`}
          >
            <ExperienceCard experience={experience} />
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No experiences found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3, 4].map((i) => (
            <SwiperSlide key={i} className="content-width-slide">
              <ExperienceCard.Skeleton />
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  )
}
