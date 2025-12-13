import { WishlistView } from '@/features/account/wishlist-view'

export default async function WishlistPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wishlist</h1>
        <p className="text-muted-foreground mt-2">
          Your saved listings
        </p>
      </div>

      <WishlistView />
    </div>
  )
}

