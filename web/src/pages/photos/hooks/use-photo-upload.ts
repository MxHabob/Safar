import { useState } from "react";
import { toast } from "sonner";
import {
  type TExifData,
  type TImageInfo,
  getPhotoExif,
  getImageInfo,
} from "@/pages/photos/lib/utils";
import { DEFAULT_PHOTOS_UPLOAD_FOLDER } from "@/constants";
import { useUploadFileApiV1FilesUploadPostMutation } from "@/generated/hooks/files";


interface UsePhotoUploadProps {
  folder?: string;
  onUploadSuccess?: (
    url: string,
    exif: TExifData | null,
    imageInfo: TImageInfo
  ) => void;
}

export function usePhotoUpload({
  folder = DEFAULT_PHOTOS_UPLOAD_FOLDER,
  onUploadSuccess,
}: UsePhotoUploadProps) {

  const { mutate: uploadFile, isPending: isUploading, optimisticData } = useUploadFileApiV1FilesUploadPostMutation({
    onSuccess: (data) => {
      onUploadSuccess?.(data.file.file_url, null, {} as TImageInfo);
    },
  });

  const handleUpload = async (file: File) => {
    uploadFile({
      body: {
        file: file.toString(),
      },
      params: {
        query: {
          category: "listing_photo",
        },
      },
    });

  };

  return {
    isUploading,
    optimisticData,
    handleUpload,
  };
}
