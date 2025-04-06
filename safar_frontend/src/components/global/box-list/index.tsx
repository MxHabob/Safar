"use client"
import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "../slider"
import { useGetBoxesQuery } from "@/redux/services/api"
import { Loader2 } from "lucide-react"
import { BoxCard } from "./box-card"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListBox = ({ overlay, selected,  ...rest }: Props) => {
  const { data: boxes, isLoading, error } = useGetBoxesQuery({})

  console.log("boxes : ",boxes )

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

  if (!boxes?.results || boxes.results.length === 0) {
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
      loop={boxes.results.length > 3}
      freeMode
      overlay={overlay}
      {...rest}
    >
      {boxes.results.map((box) => (
        <SwiperSlide
          key={box.id}
          className={`content-width-slide transition-all duration-200 ${
            selected === box.id ? "scale-[1.02]" : ""
          }`}
        >
            <BoxCard
              box={box}
            />
        </SwiperSlide>
      ))}
    </Slider>
  )
}

