"use client"

import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "@/components/global/slider"
import { useGetBoxesQuery } from "@/core/services/api"
import { BoxCard } from "./box-card"
import type { Box } from "@/core/types"
import { useSearchParams } from "next/navigation"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListBox = ({ overlay, ...rest }: Props) => {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const { data: boxes, isLoading, error } = useGetBoxesQuery({ page_size: 10, category: category || undefined })

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading boxes. Please try again later.</p>
      </div>
    )
  }

  return (
    <Slider 
      slidesPerView={3}
      spaceBetween={24} 
      centeredSlides={true}
      loop={(boxes?.count ?? 0) > 1} 
      freeMode={false}
      overlay={overlay} 
      breakpoints={{
        320: { slidesPerView: 1 },
        640: { slidesPerView: 1 },
        768: { slidesPerView: 1 },
        1024: { slidesPerView: 2 },
        1280: { slidesPerView: 2 },
        1536: { slidesPerView: 2 },
      }}
      {...rest}
    >
      {(boxes?.count ?? 0) > 0 ? (
        boxes?.results.map((box: Box) => (
          <SwiperSlide
            key={box.id}
            className="w-full h-full flex justify-center items-center"
          >
            <div className="w-full max-w-2xl mx-auto">
              <BoxCard box={box} />
            </div>
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No Boxes found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3].map((i) => (
            <SwiperSlide key={i} className="w-full h-full flex justify-center items-center">
              <div className="w-full max-w-2xl mx-auto">
                <BoxCard.Skeleton />
              </div>
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  )
}