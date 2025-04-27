"use client";
import { useGetExperienceQuery } from "@/core/services/api";
import { Calendar, Users, MapPin, Star, Clock } from 'lucide-react';
import MapboxMap from "@/components/global/mapBox";
import Image from "next/image";
import BookingCard from "@/components/global/cards/booking-card";
import { MediaGallery } from "@/components/global/media-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "@/components/global/wishlist-button";
import { ShareButton } from "@/components/global/share-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RouterBack } from "@/components/global/router-back";

export const ExperiencePageContent = ({ id }: { id: string }) => {
  const { data, isFetching, isLoading, error } = useGetExperienceQuery(id);
  const scheduleDays = (data?.schedule as { days: string[] } | undefined)?.days || [];
  const firstThreeDays = scheduleDays.slice(0, 3);
  const remainingDays = scheduleDays.length - 3;

  if (isLoading || isFetching) {
    return <ExperiencePageContent.Skeleton />;
  }
  if (error) {
    return <></>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <RouterBack/>
        <div className="flex items-center gap-2">
          <ShareButton 
            variant="outline" 
            shareText="Share" 
            item={data} 
            itemType="experience"
            className="rounded-full gap-2 hover:bg-accent transition-colors"
          />
          <WishlistButton 
            itemId={data?.id || ""} 
            itemType="experience" 
            isInwishlist={false} 
            className="rounded-full hover:bg-accent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data?.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {data?.place?.city?.name}, {data?.place?.region?.name}, {data?.place?.country?.name}
          </span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-lg dark:shadow-primary/5">
        <MediaGallery 
          media={Array.isArray(data?.media) ? data.media : []} 
          variant="carousel" 
          aspectRatio="video" 
          priority 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-md dark:shadow-primary/5 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-background shadow-md">
                  {data?.owner?.profile?.avatar ? (
                    <Image
                      src={data.owner.profile.avatar || "/placeholder.svg"}
                      alt={data.owner.username || "Host"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-lg font-bold">
                      {data?.owner?.first_name?.charAt(0)?.toUpperCase() || "H"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">Hosted by {data?.owner?.first_name} {data?.owner?.last_name}</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{data?.rating}/5 rating</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">About this experience</h2>
              <p className="text-muted-foreground leading-relaxed">{data?.description}</p>
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="border-none shadow-md dark:shadow-primary/5 bg-card hover:bg-accent/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Schedule</p>
                      <p className="font-medium">
                        {firstThreeDays.join(", ")}
                        {remainingDays > 0 && ` +${remainingDays} more`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md dark:shadow-primary/5 bg-card hover:bg-accent/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{data?.capacity} people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md dark:shadow-primary/5 bg-card hover:bg-accent/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="font-medium">{data?.rating}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md dark:shadow-primary/5 bg-card hover:bg-accent/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{data?.duration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="lg:row-start-1 lg:col-start-3">
          <div className="sticky top-4">
            {data && (
                <BookingCard id={id} data={data} placeType="experience" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Location</h2>
        <p className="text-muted-foreground">
          {data?.place?.name}, {data?.place?.city?.name}, {data?.place?.country?.name}
        </p>
        <div className="h-[400px] rounded-xl overflow-hidden shadow-lg dark:shadow-primary/5">
          <MapboxMap location={data?.location || ""} />
        </div>
      </div>

      {data?.category && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Category</h2>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              {data.category.name}
            </Badge>
            <p className="text-muted-foreground">{data.category.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

ExperiencePageContent.Skeleton = function ExperiencePageContentSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-5 w-1/2 rounded-lg" />
      </div>

      <Skeleton className="w-full aspect-[16/9] rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-48 rounded-lg mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </div>
            </div>
            
            <Skeleton className="h-px w-full" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-none shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-3 w-20 rounded-lg" />
                        <Skeleton className="h-5 w-24 rounded-lg mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:row-start-1 lg:col-start-3">
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-5 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
