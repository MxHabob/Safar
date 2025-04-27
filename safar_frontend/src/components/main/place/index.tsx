"use client"
import { useGetPlaceQuery } from "@/core/services/api";
import { MediaGallery } from "@/components/global/media-gallery";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft, Share } from "lucide-react";
import { GuestFavoriteBadge } from "@/components/global/cards/guest-favorite-badge";
import MapboxMap from "@/components/global/mapBox";
import { useRouter } from "next/navigation";
import { WishlistButton } from "@/components/global/wishlist-button";
import { Skeleton } from "@/components/ui/skeleton";

export const PlacePageContent = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useGetPlaceQuery(id)
  const router = useRouter()
  
  if (isLoading) {
    return <PlacePageContent.Skeleton />
  }
  if (error) {
    return (
      <div className="">
        
      </div>
    )
  }


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
          <WishlistButton itemId={data?.id || ""} itemType={"place"} isInwishlist={false} />
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

PlacePageContent.Skeleton =  function PlacePageContentSkeleton(){
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      
      <div className="mb-8">
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="space-y-4 w-full">
          <Skeleton className="h-8 w-3/4 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
      
      <div className="my-4">
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      
      <div className="mb-20">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
};