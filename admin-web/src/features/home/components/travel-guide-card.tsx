"use client";

import Link from "next/link";
import BlurImage from "@/components/shared/blur-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { type FileUploadResponse } from "@/generated/schemas";
import { keyToImage } from "@/lib/keyToImage";

interface TravelGuideCardProps {
  title: string;
  coverPhoto: FileUploadResponse;
}

/**
 * Travel guide card component - Displays a single travel guide destination
 * Inspired by blog-view design with bottom card overlay and hover effects
 */
const TravelGuideCard = ({ title, coverPhoto }: TravelGuideCardProps) => {
  return (
    <AspectRatio ratio={0.75 / 1}>
      <Link
        href={`/travel/${encodeURIComponent(title)}`}
        className="block w-full h-full relative rounded-[18px] overflow-hidden group cursor-pointer"
      >
        <BlurImage
          src={keyToImage(coverPhoto.file.file_url)}
          alt={coverPhoto.file.original_filename || `${title} travel destination`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
          className="object-cover group-hover:blur-xs transition-[filter] duration-300 ease-out"
          blurhash={coverPhoto.file.description}
        />

        <div className="absolute w-full bottom-0 p-3">
          <div className="bg-background backdrop-blur-xs p-4 rounded-lg flex items-center justify-between gap-8">
            <h2 className="font-light line-clamp-2">{title}</h2>

            <div className="relative mr-2 shrink-0">
              <span className="text-sm font-light">Explore</span>
              <div className="absolute bottom-[2px] left-0 w-full h-px bg-black dark:bg-white transition-all duration-300 transform ease-in-out group-hover:w-1/3"></div>
            </div>
          </div>
        </div>
      </Link>
    </AspectRatio>
  );
};

export default TravelGuideCard;

