"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CreditCard, DollarSign, Bell, ArrowRight, Search, Map, ChevronRight, Star, Clock, Heart } from 'lucide-react'

export default function DashboardContent() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Obaidullah</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your travel plans</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search destinations..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-[180px]"
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Obaidullah Al-Qurashi</span>
            <span className="text-xs text-muted-foreground">example@gmail.com</span>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg" alt="Obaidullah Al-Qurashi" />
            <AvatarFallback className="bg-primary text-primary-foreground">OA</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aesthetic Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">489.57</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </div>
            </div>
            <div className="mt-4 flex h-[40px] items-end gap-1">
              <div className="w-2 bg-primary h-[20px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[30px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[15px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[25px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[18px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[22px] rounded-t-sm" />
              <div className="w-2 bg-primary h-[28px] rounded-t-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">16</div>
                <p className="text-xs text-muted-foreground">4 upcoming this month</p>
              </div>
            </div>
            <div className="mt-4 flex h-[40px] items-center justify-between px-2">
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Payment Received</div>
                <p className="text-xs text-muted-foreground">Transaction #28492</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">Today at 2:34 PM</span>
              </div>
              <Progress value={100} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Notifications */}
        <Card className="col-span-1 row-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Upcoming Notifications</span>
              <Badge variant="outline" className="text-xs font-normal">
                New
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="2 hours ago"
              />
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="3 hours ago"
              />
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="5 hours ago"
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all notifications
            </Button>
          </CardFooter>
        </Card>

        {/* Status Circle */}
        <Card className="col-span-1 row-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Loyalty Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center">
            <div className="text-xl font-bold mb-2">Platinum</div>
            <StatusCircle value={287} maxValue={500} />
            <div className="mt-2 text-xs text-muted-foreground">213 points until Diamond status</div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="col-span-1 row-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between items-center">
              <span>Nearby Experiences</span>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Map className="h-4 w-4 mr-1" />
                <span className="text-xs">View Map</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[300px] bg-muted/20 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-primary/20 animate-ping" />
                <div className="w-4 h-4 rounded-full bg-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="absolute top-1/3 left-1/4">
                <div className="w-3 h-3 rounded-full bg-primary/70" />
              </div>
              <div className="absolute bottom-1/4 right-1/3">
                <div className="w-3 h-3 rounded-full bg-primary/70" />
              </div>
              <div className="absolute top-1/4 right-1/4">
                <div className="w-3 h-3 rounded-full bg-primary/70" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <span className="text-sm">Desert Safari</span>
                </div>
                <span className="text-xs text-muted-foreground">2.3 km</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <span className="text-sm">Beach Resort</span>
                </div>
                <span className="text-xs text-muted-foreground">3.5 km</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <span className="text-sm">City Tour</span>
                </div>
                <span className="text-xs text-muted-foreground">1.8 km</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="col-span-1 row-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Upcoming Bookings</span>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <span className="text-xs">View all</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-1">
                <BookingItem
                  title="Desert Safari Adventure"
                  location="Dubai Desert Conservation Reserve"
                  date="May 15, 2025"
                  status="Pending"
                  actions={
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Check in
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Check out
                      </Button>
                    </div>
                  }
                />
                <BookingItem
                  title="Luxury Beach Resort"
                  location="Palm Jumeirah"
                  date="June 3, 2025"
                  status="Confirmed"
                  actions={
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Check in
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Check out
                      </Button>
                    </div>
                  }
                />
              </TabsContent>
              <TabsContent value="past" className="space-y-1">
                <BookingItem
                  title="City Sightseeing Tour"
                  location="Downtown Dubai"
                  date="April 10, 2025"
                  status="Completed"
                  rating={4.5}
                />
                <BookingItem
                  title="Mountain Hiking Experience"
                  location="Hatta Mountains"
                  date="March 22, 2025"
                  status="Completed"
                  rating={5}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Experiences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recommended for You</h2>
          <Button variant="ghost" size="sm">
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Desert Safari",
              image: "/placeholder.svg?height=150&width=300",
              price: "$89",
              rating: 4.8,
              reviews: 124,
            },
            {
              title: "Yacht Cruise",
              image: "/placeholder.svg?height=150&width=300",
              price: "$199",
              rating: 4.9,
              reviews: 86,
            },
            {
              title: "Cultural Tour",
              image: "/placeholder.svg?height=150&width=300",
              price: "$45",
              rating: 4.7,
              reviews: 203,
            },
            {
              title: "Skydiving Experience",
              image: "/placeholder.svg?height=150&width=300",
              price: "$299",
              rating: 5.0,
              reviews: 58,
            },
          ].map((experience, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative h-[150px]">
                <img
                  src={experience.image || "/placeholder.svg"}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium">{experience.title}</h3>
                <div className="flex items-center mt-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs ml-1">{experience.rating}</span>
                  <span className="text-xs text-muted-foreground ml-1">({experience.reviews} reviews)</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">{experience.price}</span>
                  <span className="text-xs text-muted-foreground">per person</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Notification Item Component
function NotificationItem({
  icon,
  title,
  description,
  time,
}: { icon: React.ReactNode; title: string; description: string; time: string }) {
  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <div className="space-y-1 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// Booking Item Component
function BookingItem({
  title,
  location,
  date,
  status,
  actions,
  rating,
}: {
  title: string
  location: string
  date: string
  status: string
  actions?: React.ReactNode
  rating?: number
}) {
  return (
    <div className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Map className="h-3 w-3 mr-1" />
        <span>{location}</span>
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Calendar className="h-3 w-3 mr-1" />
        <span>{date}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge
          variant={
            status === "Pending"
              ? "outline"
              : status === "Confirmed"
                ? "secondary"
                : status === "Completed"
                  ? "default"
                  : "outline"
          }
          className="text-xs font-normal"
        >
          {status}
        </Badge>

        {rating && (
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs ml-1">{rating}</span>
          </div>
        )}
      </div>
      {actions && <div className="mt-2">{actions}</div>}
    </div>
  )
}

// Status Circle Component
function StatusCircle({ value, maxValue }: { value: number; maxValue: number }) {
  const percentage = (value / maxValue) * 100
  const circumference = 2 * Math.PI * 58 // 58 is the radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-32 w-32 -rotate-90 transform">
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          className="text-primary/10"
        />
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold">{value}</span>
      </div>
    </div>
  )
}
