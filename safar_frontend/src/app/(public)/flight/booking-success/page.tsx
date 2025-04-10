import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Booking Confirmed | Safar",
  description: "Your flight booking has been confirmed",
}

export default function BookingSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-8">
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>Your flight has been successfully booked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Thank you for booking with us. Your booking details have been sent to your email address.</p>
          <p className="text-sm text-muted-foreground">
            You can view your booking details in your account dashboard under "My Bookings".
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/flights">Book Another Flight</Link>
          </Button>
          <Button asChild>
            <Link href="/bookings">View My Bookings</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
