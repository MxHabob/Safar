"use client"
import { useGetPlaceQuery } from "@/core/services/api";
import { MediaGallery } from "@/components/global/media-gallery";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft, Heart, Share } from "lucide-react";
import { GuestFavoriteBadge } from "@/components/global/cards/guest-favorite-badge";
import MapboxMap from "@/components/global/mapBox";
import { useRouter } from "next/navigation";

export const PlacePageContent = ({ id }: { id: string }) => {
  const { data } = useGetPlaceQuery(id)
  const router = useRouter()


  console.log("data : ",data)
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center justify-center">
          <Button variant={"ghost"} onClick={() => router.back()} className="rounded-full p-4">
            <ArrowBigLeft />
          </Button>
          <h1 className="text-2xl font-bold">{data?.name || ""}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>
      <MediaGallery media={data?.media || []} className="mb-8" maxDisplay={5} />
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            {data?.name}
            {data?.country?.name && ` - ${data?.country?.name}`}
            {data?.city?.name && ` - ${data?.city?.name}`}
          </h2>
          <p className="text-lg">{data?.description}</p>
        </div>
      </div>
      <GuestFavoriteBadge rating={0} reviewCount={0} />
      <div className="max-h-[50px] mb-20">
        <MapboxMap location={data?.location || ""} />
      </div>
    </div>
  )
}
