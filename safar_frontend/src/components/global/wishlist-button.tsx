"use client"

import { Heart } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from 'sonner'
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/core/services/api'
import InteractionButton from './interaction-button'
import { InteractionType } from '@/core/types'

type WishlistItemType = 'place' | 'experience' | 'flight' | 'box'

interface WishlistButtonProps {
  itemId: string
  itemType: WishlistItemType
  isInwishlist: boolean
  className?: string
  size?: "sm" | "default" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export const WishlistButton = ({
  itemId,
  itemType,
  isInwishlist,
  className,
  size = "icon",
  variant = "ghost",
}: WishlistButtonProps) => {
  const [isinwishlist, setIsFavorited] = useState(isInwishlist)
  const [addToWishlist] = useAddToWishlistMutation()
  const [removeFromWishlist] = useRemoveFromWishlistMutation()

  const handleWishlistToggle = async () => {
    try {
      if (isinwishlist) {
        await toast.promise(
          removeFromWishlist(itemId).unwrap(),
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
        const wishlistItem = {
          [itemType]: { id: itemId }
        }
        
        await toast.promise(
          addToWishlist(wishlistItem).unwrap(),
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
    <InteractionButton
     interactionType={InteractionType.WISHLIST_ADD} contentType="safar.wishlist" objectId={itemId}    
      onClick={handleWishlistToggle}
      className={cn(
        "rounded-full transition-colors",
        className,
        isinwishlist ? "hover:bg-red-50 dark:hover:bg-red-900/20" : ""
      )}
      size={size}
      variant={variant}
      aria-label={isinwishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          isinwishlist ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400",
          size === "lg" ? "h-5 w-5" : "",
          size === "sm" ? "h-3.5 w-3.5" : ""
        )}
      />
    </InteractionButton>
  )
}