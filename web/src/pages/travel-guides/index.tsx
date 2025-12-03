"use client";

import BlurImage from "@/components/shared/blur-image";
import Footer from "@/components/footer";
import { FramedPhoto } from "@/components/shared/framed-photo";
import VectorCombined from "@/components/shared/vector-combined";
import { keyToImage } from "@/lib/keyToImage";
import { format } from "date-fns";
import { useGetGuideApiV1TravelGuidesGuideIdGet } from "@/generated/hooks";
import { TravelGuideResponse } from "@/generated/schemas";
interface Props {
  travelGuideId: string;
}

export const CityView = ({ travelGuideId }: Props) => {
  const { data } = useGetGuideApiV1TravelGuidesGuideIdGet(travelGuideId, {
    enabled: !!travelGuideId,
  });
  const travelGuide = data as TravelGuideResponse;

  return (
    <div className="size-full">
      <div className="flex flex-col gap-3 lg:gap-0 lg:flex-row w-full">
        {/* LEFT CONTENT - Fixed */}
        <div className="w-full h-[70vh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 lg:h-screen p-0 lg:p-3">
          <div className="w-full h-full relative">
            <BlurImage
              src={keyToImage(travelGuide?.cover_image_url) || "/placeholder.svg"}
              alt={travelGuide.city}
              fill
              quality={75}  
              blurhash={travelGuide?.id || ""}
              sizes="75vw"
              className="object-cover rounded-xl overflow-hidden cursor-pointer"
            />
            <div className="absolute right-0 bottom-0">
              <VectorCombined title={travelGuide.city} position="bottom-right" />
            </div>
          </div>
        </div>

        {/* Spacer for fixed left content */}
        <div className="hidden lg:block lg:w-1/2" />

        {/* RIGHT CONTENT - Scrollable */}
        <div className="w-full lg:w-1/2 space-y-3 pb-3">
          {/* CITY INFO CARD  */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3 gap-4 items-stretch">
            <div className="col-span-1 md:col-span-2 lg:col-span-1 2xl:col-span-2">
              <div className="flex flex-col p-10 gap-24 bg-muted rounded-xl font-light relative h-full">
                <div className="flex gap-4 items-center">
                  {/* NAME  */}
                  <div className="flex flex-col gap-[2px]">
                    <h1 className="text-4xl">
                      {travelGuide.city} {travelGuide.country}
                    </h1>
                  </div>
                </div>

                <div>
                  <p className="text-text-muted text-[15px]">
                    {travelGuide.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-1 lg:col-span-1 2xl:col-span-1 flex flex-col gap-3">
              <div className="w-full h-full p-3 lg:p-5 bg-muted rounded-xl flex justify-between items-center">
                <p className="text-xs text-text-muted">Country</p>
                <p className="text-xs">{travelGuide.country}</p>
              </div>

              <div className="w-full h-full p-3 lg:p-5 bg-muted rounded-xl flex justify-between items-center">
                <p className="text-xs text-text-muted">City</p>
                <p className="text-xs">{travelGuide.city}</p>
              </div>

              <div className="w-full h-full p-3 lg:p-5 bg-muted rounded-xl flex justify-between items-center">
                <p className="text-xs text-text-muted">Year</p>
                <p className="text-xs">
                  {new Date(travelGuide.published_at || "").getFullYear()}
                </p>
              </div>

              <div className="w-full h-full p-3 lg:p-5 bg-muted rounded-xl flex justify-between items-center">
                <p className="text-xs text-text-muted">Photos</p>
                <p className="text-xs">{travelGuide.image_urls?.length}</p>
              </div>
            </div>
          </div>

          {/* IMAGES  */}
          <div className="w-full space-y-2">
            {travelGuide.image_urls?.map((imageUrl) => (
              <div key={imageUrl} className="space-y-2">
                <div className="flex items-center justify-center bg-gray-50 dark:bg-muted p-4 rounded-xl">
                  <FramedPhoto
                    src={imageUrl}
                    alt={travelGuide.title}
                    blurhash={imageUrl}
                    width={100}
                    height={100}
                  />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-center">
                    {travelGuide.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {travelGuide.published_at
                      ? format(travelGuide.published_at, "d MMM yyyy")
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* FOOTER  */}
          <Footer />
        </div>
      </div>
    </div>
  );
};
