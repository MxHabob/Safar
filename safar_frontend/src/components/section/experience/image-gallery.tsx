import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Images } from "@/redux/types/types"

interface ImageGalleryProps {
  images: Images[]
}

export const ImageGallery = ({ images }: ImageGalleryProps) => {
  if (!images.length) return null

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
        <div className="md:col-span-2 md:row-span-2">
          <Image
            src={images[0].file || "/placeholder-image.jpg"}
            alt={images[0].url || "Main image"}
            width={600}
            height={600}
            className="h-full w-full object-cover rounded-tl-lg rounded-bl-lg"
          />
        </div>
        {images.slice(1, 5).map((image, index) => (
          <div key={index} className="h-48 md:h-auto">
            <Image
              src={image.file || "/placeholder-image.jpg"}
              alt={image.url || `Image ${index + 1}`}
              width={300}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        
        <Button 
          variant="secondary" 
          className="absolute bottom-4 right-4 rounded-full flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="6" height="6" />
            <rect x="15" y="3" width="6" height="6" />
            <rect x="3" y="15" width="6" height="6" />
            <rect x="15" y="15" width="6" height="6" />
          </svg>
          <span className="ml-2">Show all photos</span>
        </Button>
      </div>
    </div>
  )
}