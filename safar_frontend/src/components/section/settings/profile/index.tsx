"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Globe, Mail, MapPin, Phone, Settings, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User, Booking, Review } from "@/types"

// Sample data - replace with your actual data fetching logic
const SAMPLE_USER: User = {
  id: "user1",
  email: "supernova@safar.com",
  role: "guest",
  first_name: "Super",
  last_name: "Nova",
  username: "super-nova",
  is_online: true,
  is_active: true,
  created_at: "2022-01-01T00:00:00Z",
  updated_at: "2023-04-15T10:30:00Z",
  is_deleted: false,
  profile: {
    id: "profile1",
    phone_number: "+1 (555) 123-4567",
    gender: "male",
    avatar: "/placeholder.svg?height=300&width=300",
    bio: "Travel enthusiast and adventure seeker. Always looking for the next exciting destination to explore. Love experiencing different cultures and cuisines around the world.",
    country: "United States",
    region: "California",
    city: "San Francisco",
    postal_code: "94105",
    address: "123 Travel Street",
    date_of_birth: "1990-05-15T00:00:00Z",
    created_at: "2022-01-01T00:00:00Z",
    updated_at: "2023-04-15T10:30:00Z",
    is_deleted: false,
  },
}

// Sample bookings data
const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: "1",
    created_at: "2023-04-15T10:30:00Z",
    updated_at: "2023-04-15T10:30:00Z",
    is_deleted: false,
    user: SAMPLE_USER,
    place: {
      id: "place1",
      created_at: "2022-12-01T00:00:00Z",
      updated_at: "2022-12-01T00:00:00Z",
      is_deleted: false,
      category: {
        id: "cat1",
        name: "Beach Resort",
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      owner: {
        id: "owner1",
        email: "owner@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      name: "Sunset Beach Resort",
      description: "A beautiful beachfront resort with stunning sunset views",
      location: "Maldives",
      country: "Maldives",
      city: "Male",
      rating: 4.8,
      images: [
        {
          id: "img1",
          url: "/placeholder.svg?height=300&width=500",
          file: "beach.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      is_available: true,
      price: 350,
      currency: "USD",
    },
    check_in: "2023-05-10T15:00:00Z",
    check_out: "2023-05-15T11:00:00Z",
    booking_date: "2023-04-15T10:30:00Z",
    status: "Confirmed",
    total_price: 1750,
    currency: "USD",
    payment_status: "Paid",
  },
  {
    id: "2",
    created_at: "2023-03-14T15:45:00Z",
    updated_at: "2023-03-14T15:45:00Z",
    is_deleted: false,
    user: SAMPLE_USER,
    experience: {
      id: "exp1",
      created_at: "2022-11-01T00:00:00Z",
      updated_at: "2022-11-01T00:00:00Z",
      is_deleted: false,
      owner: {
        id: "owner2",
        email: "guide@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      title: "Guided Mountain Trek",
      description: "Experience the thrill of mountain trekking with expert guides",
      location: "Swiss Alps",
      price_per_person: 120,
      currency: "CHF",
      duration: 6,
      capacity: 10,
      schedule: [],
      images: [
        {
          id: "img2",
          url: "/placeholder.svg?height=300&width=500",
          file: "trek.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      rating: 4.9,
      is_available: true,
    },
    booking_date: "2023-03-14T15:45:00Z",
    status: "Completed",
    total_price: 240,
    currency: "CHF",
    payment_status: "Paid",
  },
]

// Sample reviews data
const SAMPLE_REVIEWS: Review[] = [
  {
    id: "1",
    created_at: "2023-05-16T14:30:00Z",
    updated_at: "2023-05-16T14:30:00Z",
    is_deleted: false,
    user: SAMPLE_USER,
    place: {
      id: "place1",
      created_at: "2022-12-01T00:00:00Z",
      updated_at: "2022-12-01T00:00:00Z",
      is_deleted: false,
      category: {
        id: "cat1",
        name: "Beach Resort",
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      owner: {
        id: "owner1",
        email: "owner@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      name: "Sunset Beach Resort",
      description: "A beautiful beachfront resort with stunning sunset views",
      location: "Maldives",
      country: "Maldives",
      city: "Male",
      rating: 4.8,
      images: [
        {
          id: "img1",
          url: "/placeholder.svg?height=300&width=500",
          file: "beach.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      is_available: true,
      price: 350,
      currency: "USD",
    },
    rating: 5,
    review_text:
      "Absolutely amazing experience! The resort was beautiful, staff was friendly, and the views were breathtaking. Would definitely recommend to anyone looking for a relaxing beach getaway.",
  },
  {
    id: "2",
    created_at: "2023-03-20T09:15:00Z",
    updated_at: "2023-03-20T09:15:00Z",
    is_deleted: false,
    user: SAMPLE_USER,
    experience: {
      id: "exp1",
      created_at: "2022-11-01T00:00:00Z",
      updated_at: "2022-11-01T00:00:00Z",
      is_deleted: false,
      owner: {
        id: "owner2",
        email: "guide@example.com",
        is_active: true,
        created_at: "2022-01-01T00:00:00Z",
        updated_at: "2022-01-01T00:00:00Z",
        is_deleted: false,
      },
      title: "Guided Mountain Trek",
      description: "Experience the thrill of mountain trekking with expert guides",
      location: "Swiss Alps",
      price_per_person: 120,
      currency: "CHF",
      duration: 6,
      capacity: 10,
      schedule: [],
      images: [
        {
          id: "img2",
          url: "/placeholder.svg?height=300&width=500",
          file: "trek.jpg",
          created_at: "2022-01-01T00:00:00Z",
          updated_at: "2022-01-01T00:00:00Z",
          is_deleted: false,
        },
      ],
      rating: 4.9,
      is_available: true,
    },
    rating: 4,
    review_text:
      "Great trek with knowledgeable guides. The views were spectacular and the pace was perfect for our group. Would have given 5 stars but it rained on the second day which limited visibility.",
  },
]

export default function ProfilePage() {
  const [user, setUser] = useState<User>(SAMPLE_USER)
  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS)
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U"
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
  }

  const getMemberSince = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left sidebar with profile info */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profile?.avatar} alt={`${user.first_name} ${user.last_name}`} />
                  <AvatarFallback className="text-2xl">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                {user.first_name} {user.last_name}
                {user.is_online && <span className="h-3 w-3 rounded-full bg-emerald-500" title="Online"></span>}
              </CardTitle>
              <CardDescription>@{user.username}</CardDescription>
              <div className="mt-2 flex justify-center">
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{user.profile?.bio || "No bio provided"}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{user.email}</p>
                  </div>

                  {user.profile?.phone_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{user.profile.phone_number}</p>
                    </div>
                  )}

                  {(user.profile?.city || user.profile?.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">
                        {[user.profile?.city, user.profile?.region, user.profile?.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}

                  {user.profile?.date_of_birth && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">Born {formatDate(user.profile.date_of_birth)}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">Member since {getMemberSince(user.created_at)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="font-semibold">{bookings.length}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{reviews.length}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">4</p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right content area with tabs */}
        <div className="flex-1">
          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="trips">Recent Trips</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Recent Trips</h2>

              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No trips yet</p>
                    <p className="text-muted-foreground text-center mb-6">
                      Start exploring and book your first adventure!
                    </p>
                    <Button asChild>
                      <Link href="/explore">Explore Destinations</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookings.map((booking) => (
                    <TripCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Reviews</h2>

              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No reviews yet</p>
                    <p className="text-muted-foreground text-center mb-6">
                      Share your experiences by leaving reviews for places you've visited.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Photos</h2>

              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No photos yet</p>
                  <p className="text-muted-foreground text-center mb-6">
                    Share your travel memories by uploading photos.
                  </p>
                  <Button>Upload Photos</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

interface TripCardProps {
  booking: Booking
}

function TripCard({ booking }: TripCardProps) {
  const getTitle = () => {
    if (booking.place) return booking.place.name
    if (booking.experience) return booking.experience.title
    if (booking.flight) return `Flight to ${booking.flight.arrival_city}`
    if (booking.box) return booking.box.name
    return "Trip"
  }

  const getLocation = () => {
    if (booking.place) return `${booking.place.city}, ${booking.place.country}`
    if (booking.experience) return booking.experience.location
    if (booking.flight) return `${booking.flight.departure_airport} to ${booking.flight.arrival_airport}`
    if (booking.box) return `${booking.box.city}, ${booking.box.country}`
    return ""
  }

  const getImage = () => {
    if (booking.place?.images?.[0]) return booking.place.images[0].url
    if (booking.experience?.images?.[0]) return booking.experience.images[0].url
    if (booking.box?.images?.[0]) return booking.box.images[0].url
    return "/placeholder.svg?height=300&width=500"
  }

  const getDate = () => {
    if (booking.check_in) {
      return new Date(booking.check_in).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    }
    if (booking.flight?.departure_time) {
      return new Date(booking.flight.departure_time).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    }
    return new Date(booking.booking_date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-40">
        <img src={getImage() || "/placeholder.svg"} alt={getTitle()} className="w-full h-full object-cover" />
        <div className="absolute top-0 right-0 p-2">
          <Badge
            className={
              booking.status === "Confirmed"
                ? "bg-emerald-500"
                : booking.status === "Completed"
                  ? "bg-sky-500"
                  : booking.status === "Cancelled"
                    ? "bg-rose-500"
                    : "bg-amber-500"
            }
          >
            {booking.status}
          </Badge>
        </div>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold text-lg">{getTitle()}</h3>
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{getLocation()}</p>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{getDate()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface ReviewCardProps {
  review: Review
}

function ReviewCard({ review }: ReviewCardProps) {
  const getTitle = () => {
    if (review.place) return review.place.name
    if (review.experience) return review.experience.title
    if (review.flight) return `Flight to ${review.flight.arrival_city}`
    return "Review"
  }

  const getLocation = () => {
    if (review.place) return `${review.place.city}, ${review.place.country}`
    if (review.experience) return review.experience.location
    if (review.flight) return `${review.flight.departure_airport} to ${review.flight.arrival_airport}`
    return ""
  }

  const getImage = () => {
    if (review.place?.images?.[0]) return review.place.images[0].url
    if (review.experience?.images?.[0]) return review.experience.images[0].url
    return "/placeholder.svg?height=300&width=500"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-300"}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/4 h-40 md:h-auto">
          <img
            src={getImage() || "/placeholder.svg"}
            alt={getTitle()}
            className="w-full h-full object-cover md:h-full"
          />
        </div>
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{getTitle()}</h3>
            <div className="flex items-center gap-1 mt-1 md:mt-0">{renderStars(review.rating)}</div>
          </div>
          <div className="flex items-center gap-1 mb-4">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{getLocation()}</p>
          </div>
          <p className="text-sm mb-4">{review.review_text}</p>
          <p className="text-xs text-muted-foreground">Reviewed on {formatDate(review.created_at)}</p>
        </div>
      </div>
    </Card>
  )
}

