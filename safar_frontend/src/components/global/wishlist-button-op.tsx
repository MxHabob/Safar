// "use client"

// import { useState } from "react"
// import { Heart } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { useGetUserWishlistQuery } from "@/core/services/api"

// import { toast } from "@/components/ui/use-toast"
// import { useAddToWishlistOptimisticMutation, useRemoveFromWishlistOptimisticMutation } from "@/core/services/optimistic-api"

// interface WishlistItem {
//   id: string
//   content_type: string
//   object_id: string
// }

// interface WishlistButtonProps {
//   entityId: string
//   entityType: "place" | "experience" | "box"
//   variant?: "default" | "outline" | "ghost"
//   size?: "default" | "sm" | "lg" | "icon"
//   showText?: boolean
// }

// export default function WishlistButton({
//   entityId,
//   entityType,
//   variant = "ghost",
//   size = "icon",
//   showText = false,
// }: WishlistButtonProps) {
//   const [isProcessing, setIsProcessing] = useState(false)
//   const { data: wishlist } = useGetUserWishlistQuery({})
//   const [addToWishlist] = useAddToWishlistOptimisticMutation()
//   const [removeFromWishlist] = useRemoveFromWishlistOptimisticMutation()

//   // Find if this entity is in the wishlist
//   const wishlistItem = (wishlist?.results as unknown as WishlistItem[]).find((item) => item.content_type === entityType && item.object_id === entityId)
//   const isInWishlist = !!wishlistItem

//   const handleToggleWishlist = async () => {
//     if (isProcessing) return

//     setIsProcessing(true)

//     try {
//       if (isInWishlist && wishlistItem) {
//         await removeFromWishlist(wishlistItem.id).unwrap()
//         toast({
//           title: "Removed from wishlist",
//           description: "Item has been removed from your wishlist",
//           variant: "default",
//         })
//       } else {
//         await addToWishlist({
//           place: entityType,
//           object_id: entityId,
//         }).unwrap()
//         toast({
//           title: "Added to wishlist",
//           description: "Item has been added to your wishlist",
//           variant: "default",
//         })
//       }
//     } catch (error) {
//       toast({
//         title: "Action failed",
//         description: "There was a problem updating your wishlist",
//         variant: "destructive",
//       })
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   return (
//     <Button
//       variant={variant}
//       size={size}
//       onClick={handleToggleWishlist}
//       disabled={isProcessing}
//       aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
//       className={isInWishlist ? "text-red-500" : ""}
//     >
//       <Heart className={`${isInWishlist ? "fill-red-500 text-red-500" : ""} ${isProcessing ? "animate-pulse" : ""}`} />
//       {showText && <span className="ml-2">{isInWishlist ? "Saved" : "Save"}</span>}
//     </Button>
//   )
// }
