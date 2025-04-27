/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { openModal } from "@/core/features/ui/modal-slice"
import { Button } from "@/components/ui/button"
import { Share } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps } from "react-day-picker"

interface ShareButtonProps extends Omit<ButtonProps, "onClick"> {
  item?: any
  itemType?: "experience" | "place" | "event" | "profile" | string
  shareText?: string
  showLabel?: boolean
  url?: string
  title?: string
  onShareOpen?: () => void
}

export const ShareButton =({
  item,
  itemType = "experience",
  shareText = "Share",
  showLabel = true,
  url,
  title,
  className,
  variant = "ghost",
  size = "default",
  onShareOpen,
  ...props
}: ShareButtonProps) => {
  const dispatch = useDispatch()
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = () => {
    if (isSharing) return

    setIsSharing(true)

    const modalData: any = {}

    if (item) {
      const itemTypeKey = itemType.charAt(0).toUpperCase() + itemType.slice(1)
      modalData[itemTypeKey] = item
    }

    if (url) modalData.customUrl = url
    if (title) modalData.customTitle = title

    dispatch(
      openModal({
        type: "ShareModal",
        data: modalData,
      }),
    )
    onShareOpen?.()
    setTimeout(() => setIsSharing(false), 300)
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
      onClick={handleShare}
      disabled={isSharing}
      {...props}
    >
      <Share className="h-4 w-4" />
      {showLabel && <span className={cn(size === "sm" ? "hidden sm:inline" : "")}>{shareText}</span>}
    </Button>
  )
}
