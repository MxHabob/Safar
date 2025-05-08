"use client"

import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "@/components/global/slider"
import { useGetBoxesQuery } from "@/core/services/api"
import { BoxCard } from "./box-card"
import type { Box } from "@/core/types"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListBox = ({ overlay, selected, ...rest }: Props) => {
  const { data: boxes, isLoading, error } = useGetBoxesQuery({ page_size: 10 }, { refetchOnMountOrArgChange: false })

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading boxes. Please try again later.</p>
      </div>
    )
  }

  return (
    <Slider 
      slidesPerView="auto" 
      spaceBetween={24} 
      loop={(boxes?.count ?? 0) > 3} 
      freeMode 
      overlay={overlay} 
      breakpoints={{
        320: { slidesPerView: 1.2, spaceBetween: 16 },
        640: { slidesPerView: 1.5, spaceBetween: 20 },
        768: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 2.5, spaceBetween: 24 },
        1280: { slidesPerView: 3, spaceBetween: 24 },
        1536: { slidesPerView: 3.5, spaceBetween: 32 },
      }}
      {...rest}
    >
      {(boxes?.count ?? 0) > 0 ? (
        boxes?.results.map((box: Box) => (
          <SwiperSlide
            key={box.id}
            className={`w-full transition-all duration-200 ${
              selected === box.id ? "scale-[1.05] md:scale-[1.1]" : ""
            }`}
          >
            <BoxCard box={box} />
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No Boxes found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <SwiperSlide key={i} className="w-full">
              <BoxCard.Skeleton />
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  )
}