'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, DollarSign, Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listBookingsApiV1BookingsGet } from '@/generated/actions/bookings'
import Link from 'next/link'
import { format } from 'date-fns'

export function BookingsView() {
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      try {
        const result = await listBookingsApiV1BookingsGet({})
        // Handle SafeActionResult - extract data if it's wrapped
        if (result && typeof result === 'object') {
          if ('data' in result && result.data) {
            return result.data as { items: any[]; total: number; skip: number; limit: number }
          }
          if ('items' in result) {
            return result as { items: any[]; total: number; skip: number; limit: number }
          }
        }
        return { items: [], total: 0, skip: 0, limit: 0 }
      } catch (error) {
        return { items: [], total: 0, skip: 0, limit: 0 }
      }
    },
  })

  const bookings = (bookingsData && 'items' in bookingsData) ? (bookingsData.items as any[]) : []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border rounded-[18px] animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="border rounded-[18px]">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-lg font-semibold">No bookings yet</p>
            <p className="text-sm text-muted-foreground">
              Start exploring amazing places and make your first booking!
            </p>
            <Link href="/listings">
              <Button className="rounded-[18px]">
                Browse Listings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      completed: { variant: 'secondary', label: 'Completed' },
    }
    const statusInfo = statusMap[status.toLowerCase()] || { variant: 'outline' as const, label: status }
    return (
      <Badge variant={statusInfo.variant} className="rounded-[18px]">
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking: any) => (
        <Card key={booking.id} className="border rounded-[18px] hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {booking.listing?.title || 'Unknown Listing'}
                </CardTitle>
                <CardDescription className="mt-1">
                  Booking #{booking.id}
                </CardDescription>
              </div>
              {getStatusBadge(booking.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {booking.check_in_date 
                      ? format(new Date(booking.check_in_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {booking.check_out_date 
                      ? format(new Date(booking.check_out_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Guests</p>
                  <p className="font-medium">{booking.number_of_guests || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {booking.total_amount 
                      ? `${booking.currency || 'USD'} ${booking.total_amount.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {booking.listing?.location && (
              <div className="flex items-center gap-2 text-sm mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {booking.listing.location}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/bookings/${booking.id}`}>
                <Button variant="outline" className="rounded-[18px]">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

