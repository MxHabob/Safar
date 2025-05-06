"use client"

import Link from "next/link"
import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide, Swiper } from "swiper/react"
import { FreeMode, Navigation, Pagination, Autoplay } from "swiper/modules"
import { ListItem } from "./list-item"
import type { Category, Country } from "@/core/types"

type Props = {
  items: Category[] | Country[];
  overlay?: boolean
  isLoading?: boolean
  selected?: string
  route?: boolean
  onSlideClick?: (item: Category | Country) => void
} & SwiperProps

export const ListSlider = ({ items, overlay, isLoading, selected, route, onSlideClick, ...rest }: Props) => {
  if (isLoading) {
    return (
      <div className="w-full mt-4 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5,6,7].map((i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full"></div>
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        maskImage: overlay
          ? `linear-gradient(to right,rgba(0, 0, 0, 0),rgba(0, 0, 0, 1) 20%,rgba(0, 0, 0, 1) 80%,rgba(0, 0, 0, 0))`
          : undefined,
      }}
      className="w-full max-w-full mt-4 relative"
    >
      {overlay && (
        <>
          <div className="absolute w-[20px] slider-overlay left-0 h-full z-50" />
          <div className="absolute w-[20px] slider-overlay-rev right-0 h-full z-50" />
        </>
      )}
      <Swiper
        modules={[Navigation, Pagination, Autoplay, FreeMode]}
        slidesPerView="auto"
        spaceBetween={10}
        loop
        freeMode
        {...rest}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="content-width-slide">
            {route ? (
              <Link href={`/?${item.name}`}>
                <ListItem name={item.name} selected={selected} />
              </Link>
            ) : (
              <div onClick={() => onSlideClick && onSlideClick(item)}>
                <ListItem name={item.name} selected={selected} />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}