"use client"

import type { WishlistItemsProps } from "./types"
import { WishlistItem } from "./wishlist-item"

export function WishlistItems({ wishlistItems, onRemoveFromWishlist }: WishlistItemsProps) {
  const places = wishlistItems.filter((item) => item.place)
  const experiences = wishlistItems.filter((item) => item.experience)
  const flights = wishlistItems.filter((item) => item.flight)
  const boxes = wishlistItems.filter((item) => item.box)

  return (
    <div className="space-y-8">
      {places.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Places</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((item) => (
              <WishlistItem key={item.id} item={item} onRemoveFromWishlist={() => onRemoveFromWishlist(item.id)} />
            ))}
          </div>
        </div>
      )}

      {experiences.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences.map((item) => (
              <WishlistItem key={item.id} item={item} onRemoveFromWishlist={() => onRemoveFromWishlist(item.id)} />
            ))}
          </div>
        </div>
      )}

      {flights.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Flights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flights.map((item) => (
              <WishlistItem key={item.id} item={item} onRemoveFromWishlist={() => onRemoveFromWishlist(item.id)} />
            ))}
          </div>
        </div>
      )}

      {boxes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Travel Boxes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boxes.map((item) => (
              <WishlistItem key={item.id} item={item} onRemoveFromWishlist={() => onRemoveFromWishlist(item.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
