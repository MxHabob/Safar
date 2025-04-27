"use client"

import { useGetPlaceQuery } from "@/core/services/api"
import { MediaGallery } from "@/components/global/media-gallery"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"
import MapboxMap from "@/components/global/mapBox"
import { useRouter } from "next/navigation"
import { WishlistButton } from "@/components/global/wishlist-button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShareButton } from "@/components/global/share-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import BookingCard from "@/components/global/cards/booking-card"


export const PlacePageContent = ({ id }: { id: string }) => {
  const { data, isLoading, error } = useGetPlaceQuery(id)
  const router = useRouter()

  if (isLoading) {
    return <PlacePageContent.Skeleton />
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold text-red-500">Error loading place</h2>
        <p className="text-muted-foreground mt-2">Please try again later</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="rounded-full p-2 hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <ShareButton
            variant="outline"
            shareText="Share"
            item={data}
            itemType="place"
            className="rounded-full gap-2 hover:bg-accent transition-colors"
          />
          <WishlistButton
            itemId={data?.id || ""}
            itemType="place"
            isInwishlist={false}
            className="rounded-full hover:bg-accent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data?.name || ""}</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {data?.city?.name && `${data.city.name}, `}
            {data?.region?.name && `${data.region.name}, `}
            {data?.country?.name}
          </span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-lg dark:shadow-primary/5">
        <MediaGallery media={data?.media || []} variant="carousel" aspectRatio="video" maxDisplay={5} priority />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-none shadow-md dark:shadow-primary/5 bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data?.city?.name && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {data.city.name}
                    </Badge>
                  )}
                  {data?.region?.name && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {data.region.name}
                    </Badge>
                  )}
                  {data?.country?.name && (
                    <Badge variant="secondary" className="px-3 py-1">
                      {data.country.name}
                    </Badge>
                  )}
                </div>

                <h2 className="text-2xl font-bold">About this place</h2>
                <p className="text-muted-foreground leading-relaxed">{data?.description}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg dark:shadow-primary/5 overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full">
                  {data?.location && <MapboxMap location={data.location} height="250px" zoom={15} />}
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-2">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {data?.city?.name && `${data.city.name}, `}
                    {data?.region?.name && `${data.region.name}, `}
                    {data?.country?.name}
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>

        <div>
          <div className="sticky top-4 space-y-4">
            {data && <BookingCard id={data.id} data={data} placeType="place" />}
          </div>
        </div>
      </div>
      {data?.experiences && data.experiences.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <h2 className="text-2xl font-bold">Experiences at this place</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.experiences.map((experience, index) => (
              <Card
                key={index}
                className="border-none shadow-md dark:shadow-primary/5 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden">
                  {Array.isArray(experience.media) && experience.media[0] && (
                    <Image
                      src={experience.media[0].url || "/placeholder.svg"}
                      alt={experience.title || "Experience"}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg line-clamp-1">{experience.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{experience.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <Badge variant="outline">{experience.category?.name || "Experience"}</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/experiences/${experience.id}`}>View details</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

PlacePageContent.Skeleton = function PlacePageContentSkeleton() {
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
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="space-y-4">
            <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-4 w-16 rounded-lg" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24 rounded-lg" />
                      <Skeleton className="h-4 w-16 rounded-lg" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                      <Skeleton className="h-5 w-20 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-[250px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-24 rounded-lg mb-2" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-24 rounded-lg mb-2" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-full rounded-lg mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
