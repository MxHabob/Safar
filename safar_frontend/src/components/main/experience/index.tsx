"use client";
import { useGetExperienceQuery } from "@/core/services/api";
import { ArrowBigLeft,Calendar, Users, MapPin, Star } from "lucide-react";
import MapboxMap from "@/components/global/mapBox";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import BookingCard from "@/components/global/cards/booking-card";
import { MediaGallery } from "@/components/global/media-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/global/wishlist-button";
import { ShareButton } from "@/components/global/share-button";

export const ExperiencePageContent = ({ id }: { id: string }) => {
  const { data , isFetching,isLoading,error } = useGetExperienceQuery(id);
  const router = useRouter();
  const scheduleDays = (data?.schedule as { days: string[] } | undefined)?.days || [];
  const firstThreeDays = scheduleDays.slice(0, 3);
  const remainingDays = scheduleDays.length - 3;

  if (isLoading || isFetching) {
    return <ExperiencePageContent.Skeleton />;
  }
  if (error) {
    return (
      <></>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant={"ghost"} onClick={() => router.back()} className="rounded-full p-4">
            <ArrowBigLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data?.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {data?.place?.city?.name}, {data?.place?.region?.name}, {data?.place?.country?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ShareButton variant="default" shareText="Share" item={data} itemType="experience"/>
          <WishlistButton itemId={data?.id || ""} itemType={"experience"} isInwishlist={false} />
        </div>
      </div>
      <MediaGallery media={Array.isArray(data?.media) ? data.media : []} variant="carousel" aspectRatio="video" priority />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-gray-200">
              {data?.owner?.profile?.avatar ? (
                <Image
                  src={data.owner.profile.avatar || "/placeholder.svg"}
                  alt={data.owner.username || "Host"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-lg font-bold">
                  {data?.owner?.first_name?.charAt(0)?.toUpperCase() || "H"}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">Hosted by {data?.owner?.first_name} {data?.owner?.last_name}</p>
            </div>
          </div>
        <div className="space-y-4">
            <h2 className="text-xl font-bold">About this experience</h2>
            <p className="text-gray-700">{data?.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium">
                    {firstThreeDays.join(", ")}
                    {remainingDays > 0 && ` +${remainingDays} more`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{data?.capacity} people</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{data?.rating}/5</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 text-gray-600">⏱️</span>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{data?.duration}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {data && <BookingCard id={id} data={data} placeType="experience" />}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Location</h2>
        <p className="text-gray-600">
          {data?.place?.name}, {data?.place?.city?.name}, {data?.place?.country?.name}
        </p>
        <div className="h-[400px] rounded-xl overflow-hidden">
          <MapboxMap location={data?.location || ""} />
        </div>
      </div>
      {data?.category && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Category</h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {data.category.name}
            </span>
            <p className="text-gray-600 text-sm">{data.category.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};


ExperiencePageContent.Skeleton = function ExperiencePageContentSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      </div>
    </div>
  );
};
