"use client"

import { ListSlider } from "../../global/list-slider"
import { Button } from "../../ui/button"
import { useGetCategoriesQuery } from "@/redux/services/api"
import { MSearch } from "./Serch"
import { Nav } from "./nav"

export function Header() {
const { data: categories ,isLoading} = useGetCategoriesQuery({})
  return (
    <header className="p">
    <Nav/>
    <MSearch/>
      <div className=" sticky top-0 flex items-center justify-between">
            <ListSlider overlay route  loop={true} isLoading={isLoading} items={categories?.results || []} />
          <div className=" flex items-center space-x-4">
            <Button className=" items-center hidden rounded-full px-4 py-2 text-sm font-medium">
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
    </header>
  )
}

