"use client";

import { useRouter } from "next/navigation";
import BlurImage from "@/components/shared/blur-image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { type FileUploadResponse } from "@/generated/schemas";
import VectorTopLeftAnimation from "./vector-top-left-animation";
import { keyToImage } from "@/lib/keyToImage";

interface Props {
  title: string;
  coverPhoto: FileUploadResponse;
}

const CityCard = ({ title, coverPhoto }: Props) => {
  const router = useRouter();

  return (
    <div
      className="w-full relative group cursor-pointer"
      onClick={() => router.push(`/travel/${title}`)}
    >
      <AspectRatio
        ratio={0.75 / 1}
        className="overflow-hidden rounded-[18px] relative group-hover:shadow-xl transition-shadow duration-500"
      >
        <BlurImage
          src={keyToImage(coverPhoto.file.file_url)}
          alt={coverPhoto.file.original_filename || `${title} travel destination`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1535px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          blurhash={coverPhoto.file.description}
        />
      </AspectRatio>

      <div className="absolute top-0 left-0 z-20">
        <VectorTopLeftAnimation title={title} />
      </div>
    </div>
  );
};

export default CityCard;
