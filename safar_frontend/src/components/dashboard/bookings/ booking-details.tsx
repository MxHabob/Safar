// "use client"

// // import { BreadcrumbPage } from "@/components/ui/breadcrumb"

// import { useState } from "react"
// import Link from "next/link"
// import Image from "next/image"
// import { useRouter } from "next/navigation"
// import {
//   ArrowLeft,
//   Calendar,
//   Download,
//   MapPin,
//   MessageSquare,
//   Package,
//   Plane,
//   Share2,
//   User,
//   X,
//   Printer,
//   Phone,
//   Mail,
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
//   XCircle,
//   Bed,
//   Building,
//   Users,
// } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Separator } from "@/components/ui/separator"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Textarea } from "@/components/ui/textarea"
// import { Booking } from "@/core/types"

// // import {
// //   Breadcrumb,
// //   BreadcrumbItem,
// //   BreadcrumbLink,
// //   BreadcrumbList,
// //   BreadcrumbSeparator,
// // } from "@/components/ui/breadcrumb"

// interface BookingDetailsProps {
//   booking: Booking
// }

// export function BookingDetails({ booking }: BookingDetailsProps) {
//   const router = useRouter()
//   const { toast } = useToast()
//   const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
//   const [cancellationReason, setCancellationReason] = useState("")
//   const [isLoading, setIsLoading] = useState(false)

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       weekday: "short",
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     })
//   }

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     })
//   }

//   const formatDateTime = (dateString: string) => {
//     return `${formatDate(dateString)} at ${formatTime(dateString)}`
//   }

//   const handleCancelBooking = () => {
//     setIsLoading(true)

//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false)
//       setCancelDialogOpen(false)

//       toast({
//         title: "Booking cancelled",
//         description: "Your booking has been successfully cancelled.",
//       })

//       router.push("/bookings")
//     }, 1500)
//   }

//   const handlePrintTicket = () => {
//     toast({
//       title: "Printing ticket",
//       description: "Your ticket is being prepared for printing.",
//     })
//     // In a real app, this would trigger the print dialog
//     window.print()
//   }

//   const handleShareBooking = () => {
//     toast({
//       title: "Share link copied",
//       description: "Booking details link has been copied to clipboard.",
//     })
//     // In a real app, this would copy a shareable link to clipboard
//   }

//   const handleDownloadTicket = () => {
//     toast({
//       title: "Downloading ticket",
//       description: "Your ticket is being downloaded.",
//     })
//     // In a real app, this would download the ticket
//   }

//   const getStatusBadge = () => {
//     switch (booking.status) {
//       case "Confirmed":
//         return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmed</Badge>
//       case "Pending":
//         return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
//       case "Cancelled":
//         return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
//       default:
//         return null
//     }
//   }

//   const getStatusIcon = () => {
//     switch (booking.status) {
//       case "Confirmed":
//         return <CheckCircle className="h-5 w-5 text-emerald-500" />
//       case "Pending":
//         return <AlertCircle className="h-5 w-5 text-amber-500" />
//       case "Cancelled":
//         return <XCircle className="h-5 w-5 text-rose-500" />
//       default:
//         return null
//     }
//   }

//   const getBookingTypeIcon = () => {
//     if (booking.place) return <Bed className="h-5 w-5" />
//     if (booking.experience) return <Users className="h-5 w-5" />
//     if (booking.flight) return <Plane className="h-5 w-5" />
//     if (booking.box) return <Package className="h-5 w-5" />
//     return null
//   }

//   const getBookingTypeName = () => {
//     if (booking.place) return "Accommodation"
//     if (booking.experience) return "Experience"
//     if (booking.flight) return "Flight"
//     if (booking.box) return "Package"
//     return "Booking"
//   }

//   const getBookingTitle = () => {
//     if (booking.place) return booking.place.name
//     if (booking.experience) return booking.experience.title
//     if (booking.flight) return `${booking.flight.departure_airport} to ${booking.flight.arrival_airport}`
//     if (booking.box) return booking.box.name
//     return "Booking Details"
//   }

//   const getBookingLocation = () => {
//     if (booking.place) return `${booking.place.city?.name}, ${booking.place.country?.name}`
//     if (booking.experience) return booking.experience.location
//     if (booking.flight) return booking.flight.arrival_city
//     if (booking.box) return `${booking.box.city?.name}, ${booking.box.country?.name}`
//     return null
//   }

//   const getBookingMedia = () => {
//     if (booking.place?.media) return booking.place.media
//     if (booking.experience?.media?.url) return [{ url: booking.experience.media.url[0] }]
//     if (booking.box?.media) return booking.box.media
//     return [{ url: "/placeholder.svg?height=600&width=800" }]
//   }

//   const renderPlaceDetails = () => {
//     if (!booking.place) return null

//     return (
//       <>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Accommodation Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-1">Description</h4>
//                 <p className="text-sm text-muted-foreground">{booking.place.description}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">Address</h4>
//                 <p className="text-sm text-muted-foreground">{booking.place.address}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">Amenities</h4>
//                 <div className="flex flex-wrap gap-2 mt-1">
//                   {booking.place.amenities?.map((amenity: string, index: number) => (
//                     <Badge key={index} variant="outline" className="bg-muted/50">
//                       {amenity}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Stay Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Check-in</h4>
//                   <p className="font-semibold">{formatDate(booking.check_in)}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Check-out</h4>
//                   <p className="font-semibold">{formatDate(booking.check_out)}</p>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium mb-1">Guests</h4>
//                 <p className="font-semibold">
//                   {booking.guests} {booking.guests === 1 ? "person" : "people"}
//                 </p>
//               </div>

//               {booking.special_requests && (
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Special Requests</h4>
//                   <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-lg">Host Information</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="bg-muted rounded-full p-3">
//                 <User className="h-6 w-6" />
//               </div>
//               <div>
//                 <h4 className="font-medium">{booking.place.host?.name}</h4>
//                 <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1">
//                   <div className="flex items-center gap-1">
//                     <Phone className="h-3 w-3" />
//                     <span>{booking.place.host?.phone}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <Mail className="h-3 w-3" />
//                     <span>{booking.place.host?.email}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </>
//     )
//   }

//   const renderExperienceDetails = () => {
//     if (!booking.experience) return null

//     return (
//       <>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Experience Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-1">Description</h4>
//                 <p className="text-sm text-muted-foreground">{booking.experience.description}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">Location</h4>
//                 <p className="text-sm text-muted-foreground">{booking.experience.location}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">Meeting Point</h4>
//                 <p className="text-sm text-muted-foreground">{booking.experience.meeting_point}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">What's Included</h4>
//                 <ul className="list-disc pl-5 text-sm text-muted-foreground">
//                   {booking.experience.included?.map((item: string, index: number) => (
//                     <li key={index}>{item}</li>
//                   ))}
//                 </ul>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Booking Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Date</h4>
//                   <p className="font-semibold">{booking.booking_time ? formatDate(booking.booking_time) : "N/A"}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Time</h4>
//                   <p className="font-semibold">{booking.booking_time ? formatTime(booking.booking_time) : "N/A"}</p>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium mb-1">Duration</h4>
//                 <p className="font-semibold">{booking.experience.duration} hours</p>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium mb-1">Guests</h4>
//                 <p className="font-semibold">
//                   {booking.guests} {booking.guests === 1 ? "person" : "people"}
//                 </p>
//               </div>

//               {booking.special_requests && (
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Special Requests</h4>
//                   <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-lg">Guide Information</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="bg-muted rounded-full p-3">
//                 <User className="h-6 w-6" />
//               </div>
//               <div>
//                 <h4 className="font-medium">{booking.experience.guide?.name}</h4>
//                 <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1">
//                   <div className="flex items-center gap-1">
//                     <Phone className="h-3 w-3" />
//                     <span>{booking.experience.guide?.phone}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <Mail className="h-3 w-3" />
//                     <span>{booking.experience.guide?.email}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </>
//     )
//   }

//   const renderFlightDetails = () => {
//     if (!booking.flight) return null

//     return (
//       <>
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-lg">Flight Details</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-lg mb-6">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <Plane className="h-5 w-5 text-sky-600 dark:text-sky-400" />
//                   <span className="font-semibold">{booking.flight.airline}</span>
//                 </div>
//                 <span className="text-sm text-muted-foreground">{booking.flight.flight_number}</span>
//               </div>
//               <div className="flex items-center justify-between mb-2">
//                 <div className="text-center">
//                   <div className="text-xl font-bold">{booking.flight.departure_airport}</div>
//                   <div className="text-sm text-muted-foreground">{formatTime(booking.flight.departure_time)}</div>
//                   <div className="text-xs text-muted-foreground">{booking.flight.terminal_info?.departure}</div>
//                 </div>
//                 <div className="flex-1 mx-4 relative">
//                   <div className="border-t border-dashed border-sky-300 dark:border-sky-700 my-2"></div>
//                   <div className="text-xs text-center text-muted-foreground">{booking.flight.duration} hours</div>
//                   <Plane className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-sky-500" />
//                 </div>
//                 <div className="text-center">
//                   <div className="text-xl font-bold">{booking.flight.arrival_airport}</div>
//                   <div className="text-sm text-muted-foreground">{formatTime(booking.flight.arrival_time)}</div>
//                   <div className="text-xs text-muted-foreground">{booking.flight.terminal_info?.arrival}</div>
//                 </div>
//               </div>
//               <div className="text-center text-sm mt-4">
//                 <span className="font-medium">Date: </span>
//                 <span>{formatDate(booking.flight.departure_time)}</span>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <h4 className="font-medium mb-2">Flight Information</h4>
//                 <ul className="space-y-2 text-sm">
//                   <li className="flex justify-between">
//                     <span className="text-muted-foreground">Cabin Class:</span>
//                     <span className="font-medium">{booking.flight.cabin_class}</span>
//                   </li>
//                   <li className="flex justify-between">
//                     <span className="text-muted-foreground">Baggage Allowance:</span>
//                     <span className="font-medium">{booking.flight.baggage_allowance}</span>
//                   </li>
//                   <li className="flex justify-between">
//                     <span className="text-muted-foreground">Destination:</span>
//                     <span className="font-medium">{booking.flight.arrival_city}</span>
//                   </li>
//                 </ul>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-2">Passenger Information</h4>
//                 {booking.passengers?.map((passenger: any, index: number) => (
//                   <div key={index} className="border-b pb-2 mb-2 last:border-0">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-muted-foreground">Passenger {index + 1}:</span>
//                       <span className="font-medium">{passenger.name}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-muted-foreground">Passport:</span>
//                       <span className="font-medium">{passenger.passport}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-muted-foreground">Seat:</span>
//                       <span className="font-medium">{passenger.seat}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </>
//     )
//   }

//   const renderPackageDetails = () => {
//     if (!booking.box) return null

//     return (
//       <>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Package Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <h4 className="font-medium mb-1">Description</h4>
//                 <p className="text-sm text-muted-foreground">{booking.box.description}</p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">Location</h4>
//                 <p className="text-sm text-muted-foreground">
//                   {booking.box.city?.name}, {booking.box.country?.name}
//                 </p>
//               </div>

//               <div>
//                 <h4 className="font-medium mb-1">What's Included</h4>
//                 <ul className="list-disc pl-5 text-sm text-muted-foreground">
//                   {booking.box.inclusions?.map((item: string, index: number) => (
//                     <li key={index}>{item}</li>
//                   ))}
//                 </ul>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Stay Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Check-in</h4>
//                   <p className="font-semibold">{formatDate(booking.check_in)}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-sm font-medium mb-1">Check-out</h4>
//                   <p className="font-semibold">{formatDate(booking.check_out)}</p>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-medium mb-1">Guests</h4>
//                 <p className="font-semibold">
//                   {booking.guests} {booking.guests === 1 ? "person" : "people"}
//                 </p>
//               </div>

//               {booking.cancellation_reason && (
//                 <div>
//                   <h4 className="text-sm font-medium mb-1 text-rose-500">Cancellation Reason</h4>
//                   <p className="text-sm text-muted-foreground">{booking.cancellation_reason}</p>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     Cancelled on {formatDateTime(booking.cancellation_date)}
//                   </p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-lg">Itinerary</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {booking.box.itinerary?.map((item: any, index: number) => (
//                 <div key={index} className="flex gap-4">
//                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//                     <span className="font-semibold text-primary">{item.day}</span>
//                   </div>
//                   <div>
//                     <p className="text-sm">{item.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="text-lg">Contact Information</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="bg-muted rounded-full p-3">
//                 <Building className="h-6 w-6" />
//               </div>
//               <div>
//                 <h4 className="font-medium">{booking.box.contact?.name}</h4>
//                 <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-muted-foreground mt-1">
//                   <div className="flex items-center gap-1">
//                     <Phone className="h-3 w-3" />
//                     <span>{booking.box.contact?.phone}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <Mail className="h-3 w-3" />
//                     <span>{booking.box.contact?.email}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </>
//     )
//   }

//   return (
//     <div className="container mx-auto py-8 px-4">
//       <Breadcrumb className="mb-6">
//         <BreadcrumbList>
//           <BreadcrumbItem>
//             <BreadcrumbLink href="/bookings">Bookings</BreadcrumbLink>
//           </BreadcrumbItem>
//           <BreadcrumbSeparator />
//           <BreadcrumbItem>
//             <BreadcrumbPage>{getBookingTitle()}</BreadcrumbPage>
//           </BreadcrumbItem>
//         </BreadcrumbList>
//       </Breadcrumb>

//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="icon" asChild>
//             <Link href="/bookings">
//               <ArrowLeft className="h-4 w-4" />
//               <span className="sr-only">Back to bookings</span>
//             </Link>
//           </Button>
//           <h1 className="text-2xl font-bold">{getBookingTitle()}</h1>
//           {getStatusBadge()}
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <Button variant="outline" size="sm" onClick={handlePrintTicket}>
//             <Printer className="h-4 w-4 mr-2" />
//             Print
//           </Button>
//           <Button variant="outline" size="sm" onClick={handleDownloadTicket}>
//             <Download className="h-4 w-4 mr-2" />
//             Download
//           </Button>
//           <Button variant="outline" size="sm" onClick={handleShareBooking}>
//             <Share2 className="h-4 w-4 mr-2" />
//             Share
//           </Button>
//           {booking.status !== "Cancelled" && (
//             <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="destructive" size="sm">
//                   <X className="h-4 w-4 mr-2" />
//                   Cancel Booking
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Cancel Booking</DialogTitle>
//                   <DialogDescription>
//                     Are you sure you want to cancel this booking? This action cannot be undone.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="py-4">
//                   <label htmlFor="reason" className="text-sm font-medium mb-2 block">
//                     Reason for cancellation (optional)
//                   </label>
//                   <Textarea
//                     id="reason"
//                     placeholder="Please tell us why you're cancelling..."
//                     value={cancellationReason}
//                     onChange={(e) => setCancellationReason(e.target.value)}
//                   />
//                 </div>
//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
//                     Keep Booking
//                   </Button>
//                   <Button variant="destructive" onClick={handleCancelBooking} disabled={isLoading}>
//                     {isLoading ? "Cancelling..." : "Confirm Cancellation"}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//         <div className="lg:col-span-2">
//           <div className="relative rounded-lg overflow-hidden mb-6">
//             <div className="aspect-video">
//               <Image
//                 src={getBookingMedia()[0]?.url || "/placeholder.svg?height=600&width=800"}
//                 alt={getBookingTitle()}
//                 fill
//                 className="object-cover"
//                 priority
//               />
//             </div>
//             <div className="absolute top-4 left-4">
//               <Badge className="bg-white/90 text-black hover:bg-white/80">
//                 {getBookingTypeIcon()}
//                 <span className="ml-1">{getBookingTypeName()}</span>
//               </Badge>
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-2 mb-6">
//             {getBookingMedia()
//               .slice(1, 4)
//               .map((media, index) => (
//                 <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
//                   <Image
//                     src={media.url || "/placeholder.svg"}
//                     alt={`${getBookingTitle()} image ${index + 2}`}
//                     fill
//                     className="object-cover"
//                   />
//                 </div>
//               ))}
//           </div>

//           <Tabs defaultValue="details" className="mb-6">
//             <TabsList className="mb-4">
//               <TabsTrigger value="details">Details</TabsTrigger>
//               <TabsTrigger value="payment">Payment</TabsTrigger>
//               <TabsTrigger value="support">Support</TabsTrigger>
//             </TabsList>

//             <TabsContent value="details">
//               {renderPlaceDetails()}
//               {renderExperienceDetails()}
//               {renderFlightDetails()}
//               {renderPackageDetails()}
//             </TabsContent>

//             <TabsContent value="payment">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Payment Information</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <CreditCard className="h-5 w-5 text-muted-foreground" />
//                       <span className="font-medium">Payment Method</span>
//                     </div>
//                     <span>Credit Card (•••• 4242)</span>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Calendar className="h-5 w-5 text-muted-foreground" />
//                       <span className="font-medium">Payment Date</span>
//                     </div>
//                     <span>{formatDate(booking.booking_date)}</span>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <CheckCircle className="h-5 w-5 text-muted-foreground" />
//                       <span className="font-medium">Payment Status</span>
//                     </div>
//                     <Badge variant={booking.payment_status === "Paid" ? "default" : "outline"}>
//                       {booking.payment_status}
//                     </Badge>
//                   </div>

//                   <Separator />

//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-muted-foreground">Subtotal</span>
//                       <span>
//                         {(booking.total_price * 0.9).toFixed(2)} {booking.currency}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-muted-foreground">Taxes & Fees</span>
//                       <span>
//                         {(booking.total_price * 0.1).toFixed(2)} {booking.currency}
//                       </span>
//                     </div>
//                     <div className="flex justify-between font-semibold text-lg pt-2">
//                       <span>Total</span>
//                       <span>
//                         {booking.total_price.toFixed(2)} {booking.currency}
//                       </span>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="support">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-lg">Customer Support</CardTitle>
//                   <CardDescription>Need help with your booking? Contact our support team.</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex items-center gap-3">
//                     <Phone className="h-5 w-5 text-muted-foreground" />
//                     <div>
//                       <h4 className="font-medium">Phone Support</h4>
//                       <p className="text-sm text-muted-foreground">+1 (800) 123-4567</p>
//                       <p className="text-xs text-muted-foreground">Available 24/7</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     <Mail className="h-5 w-5 text-muted-foreground" />
//                     <div>
//                       <h4 className="font-medium">Email Support</h4>
//                       <p className="text-sm text-muted-foreground">support@example.com</p>
//                       <p className="text-xs text-muted-foreground">Response within 24 hours</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     <MessageSquare className="h-5 w-5 text-muted-foreground" />
//                     <div>
//                       <h4 className="font-medium">Live Chat</h4>
//                       <p className="text-sm text-muted-foreground">Chat with our support team</p>
//                       <p className="text-xs text-muted-foreground">Available 9 AM - 9 PM</p>
//                     </div>
//                   </div>
//                 </CardContent>
//                 <CardFooter>
//                   <Button className="w-full">
//                     <MessageSquare className="h-4 w-4 mr-2" />
//                     Start Chat
//                   </Button>
//                 </CardFooter>
//               </Card>
//             </TabsContent>
//           </Tabs>
//         </div>

//         <div>
//           <Card className="sticky top-6">
//             <CardHeader>
//               <CardTitle>Booking Summary</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center gap-2">
//                 {getStatusIcon()}
//                 <span className="font-medium">Status: {booking.status}</span>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm">Booked on {formatDate(booking.booking_date)}</span>
//               </div>

//               {getBookingLocation() && (
//                 <div className="flex items-center gap-2">
//                   <MapPin className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-sm">{getBookingLocation()}</span>
//                 </div>
//               )}

//               {booking.check_in && booking.check_out && (
//                 <div className="border rounded-md p-3 space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Check-in:</span>
//                     <span className="font-medium">{formatDate(booking.check_in)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Check-out:</span>
//                     <span className="font-medium">{formatDate(booking.check_out)}</span>
//                   </div>
//                 </div>
//               )}

//               {booking.flight && (
//                 <div className="border rounded-md p-3 space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Departure:</span>
//                     <span className="font-medium">{formatDateTime(booking.flight.departure_time)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Arrival:</span>
//                     <span className="font-medium">{formatDateTime(booking.flight.arrival_time)}</span>
//                   </div>
//                 </div>
//               )}

//               {booking.booking_time && (
//                 <div className="border rounded-md p-3 space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Date:</span>
//                     <span className="font-medium">{formatDate(booking.booking_time)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Time:</span>
//                     <span className="font-medium">{formatTime(booking.booking_time)}</span>
//                   </div>
//                 </div>
//               )}

//               <Separator />

//               <div className="space-y-1">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Booking ID:</span>
//                   <span className="font-mono">{booking.id}</span>
//                 </div>

//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Payment:</span>
//                   <span>{booking.payment_status}</span>
//                 </div>

//                 <div className="flex justify-between font-semibold pt-2">
//                   <span>Total:</span>
//                   <span>
//                     {booking.total_price} {booking.currency}
//                   </span>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="flex flex-col gap-2">
//               {booking.status !== "Cancelled" && (
//                 <Button className="w-full" asChild>
//                   <Link href={`/bookings/${booking.id}/modify`}>Modify Booking</Link>
//                 </Button>
//               )}
//               <Button variant="outline" className="w-full" asChild>
//                 <Link href="/support">
//                   <MessageSquare className="h-4 w-4 mr-2" />
//                   Contact Support
//                 </Link>
//               </Button>
//             </CardFooter>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }
