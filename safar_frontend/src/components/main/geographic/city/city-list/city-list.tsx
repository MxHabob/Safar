"use client"

import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "@/components/global/slider"
import { useGetCitiesQuery } from "@/core/services/api"
import type { City } from "@/core/types"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListCities = ({ overlay, selected, ...rest }: Props) => {
  const { data, isLoading, error,} = useGetCitiesQuery({ page_size: 10},{ refetchOnMountOrArgChange: false })

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading data. Please try again later.</p>
      </div>
    )
  }


  return (
    <Slider
      slidesPerView="auto"
      spaceBetween={16}
      loop={(data?.count ?? 0) > 3}
      freeMode
      overlay={overlay}
      {...rest}
    >
      {(data?.count ?? 0) > 0 ? (
        data?.results.map((city: City) => (
          <SwiperSlide
            key={city.id}
            className={`content-width-slide transition-all duration-200 ${
              selected === city.id ? "scale-[1.02]" : ""
            }`}
          >
            {/* <ExperienceCard city={city} /> */}
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No data found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3, 4,5].map((i) => (
            <SwiperSlide key={i} className="content-width-slide">
              {/* <ExperienceCard.Skeleton /> */}
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  )
}
