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
  console.log("boxes : ", boxes)

  return (
    <Slider slidesPerView="auto" spaceBetween={16} loop={(boxes?.count ?? 0) > 3} freeMode overlay={overlay} {...rest}>
      {(boxes?.count ?? 0) > 0 ? (
        boxes?.results.map((box: Box) => (
          <SwiperSlide
            key={box.id}
            className={`content-width-slide transition-all pb-4 duration-200 ${
              selected === box.id ? "scale-[1.02]" : ""
            }`}
          >
            <BoxCard box={box} />
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No places found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3, 4].map((i) => (
            <SwiperSlide key={i} className="content-width-slide">
              <BoxCard.Skeleton />
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  )
}
