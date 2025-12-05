import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { WishlistView } from '@/components/account/wishlist-view'

export default async function WishlistPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

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

