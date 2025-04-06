"use client";
import { useGetExperienceQuery } from "@/redux/services/api";
import { ImageGallery } from "./image-gallery";
import { ArrowBigLeft, Heart, Share } from "lucide-react";
import { GuestFavoriteBadge } from "@/components/global/cards/guest-favorite-badge";
import MapboxMap from "@/components/global/mapBox";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image"


export const ExperiencePageContent = ({id}:{id:string}) => {
    const { data } = useGetExperienceQuery(id);
    const router = useRouter();
    console.log("experience : ",data)

    return(
 <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center justify-center">
          <Button variant={"ghost"}  onClick={()=> router.back()} className="rounded-full p-4">
           <ArrowBigLeft />
          </Button>
          <h1 className="text-2xl font-bold">{data?.title} - {data?.place?.country} - <span>{data?.place?.city}</span></h1>
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
        <ImageGallery images={data?.images || []} />   
        <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="space-y-4">
          <p className="text-lg">{data?.description}</p>
        </div>
      </div>  
      <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-200">
                    {data?.owner?.profile?.avatar ? (
                      <Image
                        src={data.owner.profile.avatar || "/placeholder.svg"}
                        alt={data.owner.username || "Host"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
                        {data?.owner?.first_name?.charAt(0)?.toUpperCase() || "H"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    by {data?.owner?.first_name  || "Host"} {data?.owner?.last_name}
                  </span>
                </div>
      <GuestFavoriteBadge rating={0} reviewCount={0} />
      <div className="max-h[50px] mb-20">
      <MapboxMap location={data?.location || ""} />
      </div>
    </div>
    )
}