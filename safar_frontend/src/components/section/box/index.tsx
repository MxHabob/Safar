"use client"

import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useGetBoxQuery } from "@/redux/services/api"
import MapView from "./map-view"
import BoxContentsView from "./box-contents-view"

export const BoxPageContant = ({id}:{id:string}) => {
  const { data: box, isLoading, error } = useGetBoxQuery(id)

  if (isLoading) {
    return (
      <div className="">
       
      </div>
    )
  }

  if (error || !box) {
    return (
      <div className="">
       
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div className="h-[50vh] md:h-screen md:w-1/2 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{box.name}</h1>
        <BoxContentsView />
      </div>
      <div className="h-[50vh] md:h-screen md:w-1/2 relative">
        <MapView />
      </div>
    </div>
  )
}

