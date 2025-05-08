"use client"

import { Autoplay, FreeMode, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperProps } from "swiper/react"
import InfiniteScrollObserver from "../infinite-scroll-observer"

type SliderProps = {
  children: React.ReactNode
  overlay?: boolean
  isLoading?: boolean;
} & SwiperProps

export const Slider = ({ children, overlay,isLoading, ...rest }: SliderProps) => {
  return (
    <InfiniteScrollObserver loadingComponent={isLoading}>
    <div
      style={{
        maskImage: `linear-gradient(to right,rgba(0, 0, 0, 0),rgba(0, 0, 0, 1) 5%,rgba(0, 0, 0, 1) 95%,rgba(0, 0, 0, 0))`,
      }}
      className="w-full max-w-full mt-4 relative"
    >
      {overlay && (
        <>
          <div className="absolute w-[20px] slider-overlay left-0 h-full z-50" />
          <div className="absolute w-[20px] slider-overlay-rev right-0 h-full z-50" />
        </>
      )}
      <Swiper modules={[Navigation, Pagination, Autoplay, FreeMode]} {...rest}>
        {children}
      </Swiper>
    </div>
    </InfiniteScrollObserver>
  )
}
