"use client"

import { Heart } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useState } from "react"
import { toast } from 'sonner'
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/redux/services/api'

interface WishlistButtonProps {
  placeId: string
  isInitiallyFavorited: boolean
  className?: string
  size?: "sm" | "default" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export const WishlistButton = ({
  placeId,
  isInitiallyFavorited,
  className,
  size = "icon",
  variant = "ghost",
}: WishlistButtonProps) => {
  const [isFavorited, setIsFavorited] = useState(isInitiallyFavorited)
  const [addToWishlist] = useAddToWishlistMutation()
  const [removeFromWishlist] = useRemoveFromWishlistMutation()

  const handleWishlistToggle = async () => {
    try {
      if (isFavorited) {
        await toast.promise(
          removeFromWishlist(placeId).unwrap(),
          {
            loading: 'Removing from wishlist...',
            success: () => {
              setIsFavorited(false)
              return 'Removed from wishlist!'
            },
            error: 'Failed to remove from wishlist',
          }
        )
      } else {
        await toast.promise(
          addToWishlist({ place: placeId }).unwrap(),
          {
            loading: 'Adding to wishlist...',
            success: () => {
              setIsFavorited(true)
              return 'Added to wishlist!'
            },
            error: 'Failed to add to wishlist',
          }
        )
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
    }
  }

  return (
    <Button
      onClick={handleWishlistToggle}
      className={cn(
        "rounded-full transition-colors",
        className,
        isFavorited ? "hover:bg-red-50 dark:hover:bg-red-900/20" : ""
      )}
      size={size}
      variant={variant}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          isFavorited ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400",
          size === "lg" ? "h-5 w-5" : "",
          size === "sm" ? "h-3.5 w-3.5" : ""
        )}
      />
    </Button>
  )
}