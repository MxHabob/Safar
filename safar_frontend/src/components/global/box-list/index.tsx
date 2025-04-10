"use client"
import "swiper/css/bundle"
import { type SwiperProps, SwiperSlide } from "swiper/react"
import { Slider } from "../slider"
import { useGetBoxesQuery } from "@/redux/services/api"
import { BoxCard } from "./box-card"

type Props = {
  overlay?: boolean
  selected?: string
} & SwiperProps

export const ListBox = ({ overlay, selected,  ...rest }: Props) => {
  const { data: boxes, isLoading, error } = useGetBoxesQuery({})

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading boxes. Please try again later.</p>
      </div>
    )
  }

  console.log("boxes", boxes)

  return (

<Slider
slidesPerView="auto"
spaceBetween={16}
loop={(boxes?.count ?? 0) > 3}
freeMode
overlay={overlay}
{...rest}
>
 {(boxes?.count ?? 0) > 0 ? (
  boxes?.results.map((box) => (
  <SwiperSlide
    key={box.id}
    className={`content-width-slide transition-all pb-4 duration-200 ${
      selected === box.id ? "scale-[1.02]" : ""
    }`}
  >
      <BoxCard box={box}/>
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
            <BoxCard.Skeleton />
            <BoxCard.Skeleton />
            <BoxCard.Skeleton />
            <BoxCard.Skeleton />
            </div>
          </div>
        )}
</Slider>
)
}