import { BookingsView } from '@/features/account/bookings-view'

export default async function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your bookings
        </p>
      </div>

      <BookingsView />
    </div>
  )
}

