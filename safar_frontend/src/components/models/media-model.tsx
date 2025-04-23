"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Menu, Share } from 'lucide-react'
import { useModal } from "@/core/hooks/use-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Media } from "@/core/types"
import { Modal } from "../global/modal"

export const MediaModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const [currentIndex, setCurrentIndex] = useState(0)

  const mediaItem = data.media as Media
  const mediaArray = (data.mediaArray as Media[]) || []
  const initialIndex = (data.initialIndex as number) || 0

  const allMedia = mediaArray.length
    ? mediaArray
    : Array.isArray(data.media)
      ? data.media
      : mediaItem
        ? [mediaItem]
        : []

  useEffect(() => {
    if (isOpen && type === "MediaModal") {
      setCurrentIndex(initialIndex || 0)
    }
  }, [isOpen, initialIndex, type])

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (allMedia.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % allMedia.length)
    }
  }

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (allMedia.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
    }
  }

  const isMediaModalOpen = isOpen && type === "MediaModal"

  if (!isMediaModalOpen || !allMedia.length) return null

  const currentMedia = allMedia[currentIndex]
  const isVideo = currentMedia?.type === 'video'

  return (
    <Modal
      isOpen={isMediaModalOpen}
      onClose={onClose}
      className={cn(
        "!w-[75vw] !h-[85vh] !max-w-none !max-h-none !rounded-xl bg-card m-auto p-6",
      )}
    >
      <div className="flex flex-col h-full relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
              <Image 
                src="/placeholder.svg?height=24&width=24" 
                alt="Logo" 
                width={24} 
                height={24} 
                className="rounded-full"
              />
            </div>
            <span className="font-medium text-lg">Media Gallery</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="link" className="absolute top-[-1.8vh] right-4 font-medium text-lg">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 relative overflow-hidden mt-8">
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              <video
                src={currentMedia?.file || currentMedia?.url || ""}
                className="rounded-lg max-h-full max-w-full"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={currentMedia?.file || currentMedia?.url || ""}
                alt="Media"
                fill
                className="rounded-lg object-contain"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {allMedia.length > 1 && (
            <>
              <Button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full z-10"
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Previous media</span>
              </Button>
              <Button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full z-10"
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="h-6 w-6" />
                <span className="sr-only">Next media</span>
              </Button>
            </>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center my-2">
            <div className="font-medium text-md">
              {currentIndex + 1} / {allMedia.length}
            </div>
            <div className="flex gap-2">
              <Button size="lg" className="rounded-full font-mono text-md p-5">
                Save
              </Button>
              <Button variant="secondary" size="lg" className="rounded-full font-mono text-md p-5">
                Copy
              </Button>
              <Button variant="secondary" size="lg" className="rounded-full font-mono text-md p-5">
                <Menu/>
              </Button>
            </div>
            <div className="flex gap-2">
              <p></p>
            </div>
          </div>

          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin items-center justify-center scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {allMedia.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative w-16 h-16 flex-shrink-0 cursor-pointer rounded overflow-hidden",
                    index === currentIndex && "ring-2 ring-primary"
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={item.file || item.url || ""}
                        className="object-cover w-full h-full"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={item.file || item.url || ""}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
