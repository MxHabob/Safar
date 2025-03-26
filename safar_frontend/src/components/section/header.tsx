"use client"

import Link from "next/link"
import { Search, Globe, Menu, User } from "lucide-react"
import { ListSlider } from "../global/list-slider"
import { Button } from "../ui/button"
import { useGetCategoriesQuery } from "@/redux/services/api"

export function Header() {
const { data: categories  } = useGetCategoriesQuery()

console.log(categories)
  return (
    <header className="w-full h-full px-10">
      <div className=" flex items-center justify-between py-4">
        <div className="flex items-center">
          <Link href="/" className="">
            <span className="ml-2 text-lg font-bold">Safar</span>
          </Link>
        </div>
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li>
              <Link href="#" className="font-mediumpb-2">
                Homes
              </Link>
            </li>
            <li>
              <Link href="#" className="font-medium">
                Experiences
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center space-x-4">
          <Button className="rounded-full p-2 ">
            <Globe className="h-5 w-5" />
          </Button>
          <Button className="flex items-center rounded-full border p-2 hover:shadow-md">
            <Menu className="h-5 w-5 mr-2" />
            <div className="bg-gray-500 rounded-full h-8 w-8 flex items-center justify-center overflow-hidden">
              <User className="h-5 w-5 " />
            </div>
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center rounded-full border shadow-sm">
            <div className="flex-1 border-r px-6 py-3">
              <div className="text-sm font-medium">Where</div>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full border-none p-0 text-sm focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex-shrink-0 px-6 py-3">
              <div className="text-sm font-medium">Who</div>
              <div className="text-sm mr-12 ">Add guests</div>
            </div>
            <Button className="absolute right-0 flex h-12 w-12 items-center justify-center rounded-full bg-primary ">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
            <ListSlider  overlay route items={categories?.results || []} />
          <div className="ml-4 flex items-center space-x-4">
            <Button className="flex items-center rounded-full px-4 py-2 text-sm font-medium">
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

