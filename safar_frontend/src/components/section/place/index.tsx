"use client";
import { useGetPlaceQuery } from "@/redux/services/api";
import { ImageGallery } from "./image-gallery";
import { Button } from "@/components/ui/button";
import { Heart, Share } from "lucide-react";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { GuestFavoriteBadge } from "@/components/global/cards/guest-favorite-badge";
import { BookingSummaryCard } from "@/components/global/cards/booking-summary-card";

export const PlacePageContant = ({id}:{id:string}) => {
    const { data } = useGetPlaceQuery(id)
    console.log("place : ",data)
    return ( 
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded">
            <Avatar src={data?.owner.profile?.avatar} alt={data?.owner.username || "User avatar"} >
                <AvatarFallback className=" font-bold uppercase text-lg">{data?.owner.username?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
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
        <ImageGallery images={data?.images || []} />   
        <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{data?.name} - {data?.country} - <span>{data?.city}</span></h2>
          <p className="text-lg">{data?.description}</p>
        </div>
        <BookingSummaryCard originalPrice={data?.price || 5} guests={5} priceBreakdown={[{ label: "Base Price", amount: 12 }, { label: "Service Fee", amount: 15 }]}/>
      </div>    
      <GuestFavoriteBadge rating={0} reviewCount={0} />
    </div>
);
}
 