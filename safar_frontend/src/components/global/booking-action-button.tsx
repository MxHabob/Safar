// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"
// import { toast } from "@/components/ui/use-toast"
// import { useCancelBookingOptimisticMutation, useCreateBookingOptimisticMutation } from "@/core/services/optimistic-api"

// interface BookingActionButtonProps {
//   action: "book" | "cancel"
//   bookingId?: string
//   experienceId?: string
//   date?: string
//   guests?: number
//   onSuccess?: () => void
// }

// export default function BookingActionButton({
//   action,
//   bookingId,
//   experienceId,
//   date,
//   guests,
//   onSuccess,
// }: BookingActionButtonProps) {
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [isDialogOpen, setIsDialogOpen] = useState(false)

//   const [createBooking] = useCreateBookingOptimisticMutation()
//   const [cancelBooking] = useCancelBookingOptimisticMutation()

//   const handleBook = async () => {
//     if (!experienceId || !date || !guests) {
//       toast({
//         title: "Missing information",
//         description: "Please provide all required booking details",
//         variant: "destructive",
//       })
//       return
//     }

//     setIsProcessing(true)

//     try {
//       await createBooking({
//         content_type: "experience",
//         object_id: experienceId,
//         date,
//         guests,
//         status: "pending",
//       }).unwrap()

//       toast({
//         title: "Booking created",
//         description: "Your booking has been created successfully",
//         variant: "default",
//       })

//       if (onSuccess) onSuccess()
//     } catch (error) {
//       toast({
//         title: "Booking failed",
//         description: "There was a problem creating your booking",
//         variant: "destructive",
//       })
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   const handleCancel = async () => {
//     if (!bookingId) return

//     setIsProcessing(true)
//     setIsDialogOpen(false)

//     try {
//       await cancelBooking(bookingId).unwrap()

//       toast({
//         title: "Booking cancelled",
//         description: "Your booking has been cancelled successfully",
//         variant: "default",
//       })

//       if (onSuccess) onSuccess()
//     } catch (error) {
//       toast({
//         title: "Cancellation failed",
//         description: "There was a problem cancelling your booking",
//         variant: "destructive",
//       })
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   if (action === "book") {
//     return (
//       <Button onClick={handleBook} disabled={isProcessing || !experienceId || !date || !guests} className="w-full">
//         {isProcessing ? "Processing..." : "Book Now"}
//       </Button>
//     )
//   }

//   if (action === "cancel") {
//     return (
//       <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <AlertDialogTrigger asChild>
//           <Button variant="destructive" disabled={isProcessing || !bookingId}>
//             {isProcessing ? "Processing..." : "Cancel Booking"}
//           </Button>
//         </AlertDialogTrigger>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to cancel this booking? This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Keep Booking</AlertDialogCancel>
//             <AlertDialogAction onClick={handleCancel}>Yes, Cancel Booking</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     )
//   }

//   return null
// }
