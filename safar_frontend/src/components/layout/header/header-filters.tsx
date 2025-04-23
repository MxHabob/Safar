"use client"

import { ListSlider } from "@/components/global/list-slider"
import { Button } from "@/components/ui/button"
import { useGetCategoriesQuery } from "@/core/services/api"

export function HeaderFilters() {
    const { data: categories ,isLoading} = useGetCategoriesQuery({})
  return (
<div className="flex items-center justify-between mx-96 mb-4">
    <ListSlider route  loop={true} isLoading={isLoading} items={categories?.results || []} />
   <div className="  items-center hidden">
    <Button className=" items-center rounded-full px-4  text-sm font-medium">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mr-2 h-4 w-4"
      >
        <path d="M4 6h8M4 10h8" />
      </svg>
      Filters
    </Button>
  </div>
</div>
  )
}

