import BlurImage from "@/components/shared/blur-image";
import { TravelGuideResponse } from "@/generated/schemas";
import { keyToImage } from "@/lib/keyToImage";
import VectorCombined from "@/components/shared/vector-combined";

interface CoverPhotoProps {
  travelGuideId: string;
  travelGuides: TravelGuideResponse[];
}

export const CoverPhoto = ({ travelGuideId, travelGuides }: CoverPhotoProps) => {
  return (
    <div className="w-full h-[70vh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 lg:h-screen p-0 lg:p-3">
      <div className="w-full h-full relative rounded-xl overflow-hidden">
        {/* Cover photo */}
        <div className="relative w-full h-full">
          {travelGuides?.map((travelGuide) => (
            <div
              key={travelGuide.id}
              className={`absolute inset-0 transition-opacity duration-300 ${
                travelGuide.id === travelGuideId ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <BlurImage
                src={keyToImage(travelGuide.cover_image_url)}
                alt={travelGuide.city}
                fill
                blurhash={travelGuide.id}
                sizes="75vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute right-0 bottom-0 z-10">
          <VectorCombined title={ ""} position="bottom-right" />
        </div>
      </div>
    </div>
  );
};
