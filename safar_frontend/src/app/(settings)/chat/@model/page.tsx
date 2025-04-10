"use client"

import { useState } from "react"
import { useModal } from "@/redux/hooks/use-modal"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ExampleUsage() {
  const { onOpen } = useModal()
  const [isLoading, setIsLoading] = useState(false)

  // Example booking data
  const exampleBooking = {
    id: "booking_123",
    status: "Confirmed",
    check_in: new Date().toISOString(),
    check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
    booking_date: new Date().toISOString(),
    total_price: 350,
    currency: "USD",
    payment_status: "Paid",
    user: {
      first_name: "John",
      last_name: "Doe",
    },
    place: {
      name: "Luxury Beach Villa",
      location: "Malibu, CA",
    },
  }

  // Example place data
  const examplePlace = {
    id: "place_123",
    name: "Mountain Retreat",
    description: "A beautiful cabin in the mountains",
    location: "Aspen, CO",
    price: 200,
  }

  // Example experience data
  const exampleExperience = {
    id: "exp_123",
    title: "Wine Tasting Tour",
    description: "Explore the finest wineries in the region",
    location: "Napa Valley, CA",
    price_per_person: 75,
    duration: 3,
    capacity: 10,
  }

  const handleAsyncOperation = () => {
    setIsLoading(true)

    const operationPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve("Operation completed")
      }, 2000)
    })

    toast.promise(operationPromise, {
      loading: "Processing your request...",
      success: "Operation completed successfully!",
      error: "Something went wrong",
    })

    operationPromise
      .then(() => {
        // Additional logic after success
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Modal Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button onClick={() => onOpen("CreateOrEditPlace")}>Create Place</Button>
          <Button onClick={() => onOpen("CreateOrEditPlace", { Place: examplePlace })}>Edit Place</Button>
          <Button onClick={() => onOpen("deletePlace", { Place: examplePlace })}>Delete Place</Button>
          <Button onClick={() => onOpen("CreateOrEditExperience")}>Create Experience</Button>
          <Button onClick={() => onOpen("CreateOrEditExperience", { Experience: exampleExperience })}>
            Edit Experience
          </Button>
          <Button onClick={() => onOpen("deleteExperience", { Experience: exampleExperience })}>
            Delete Experience
          </Button>
          <Button onClick={() => onOpen("BookingDetails", { Booking: exampleBooking })}>Booking Details</Button>
          <Button
            onClick={() =>
              onOpen("BookingConfirmationOrCancellation", {
                Booking: { ...exampleBooking, status: "Pending" },
              })
            }
          >
            Confirm Booking
          </Button>
          <Button onClick={() => onOpen("BookingConfirmationOrCancellation", { Booking: exampleBooking })}>
            Cancel Booking
          </Button>
          <Button onClick={() => onOpen("BookingModification", { Booking: exampleBooking })}>Modify Booking</Button>
          <Button
            onClick={() =>
              onOpen("SuccessOrFailure", {
                success: true,
                message: "Your operation was successful!",
              })
            }
          >
            Success Message
          </Button>
          <Button
            onClick={() =>
              onOpen("SuccessOrFailure", {
                success: false,
                message: "Something went wrong with your operation.",
              })
            }
          >
            Error Message
          </Button>
          <Button onClick={() => onOpen("PaymentConfirmation", { Booking: exampleBooking })}>Confirm Payment</Button>
          <Button onClick={() => onOpen("Events")}>Browse Events</Button>
          <Button onClick={() => onOpen("ChatModel", { Booking: exampleBooking })}>Open Chat</Button>
          <Button onClick={() => onOpen("DiscountDetails", { Booking: exampleBooking })}>Discount Details</Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Toast Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button onClick={() => toast.success("Operation completed successfully!")}>Success Toast</Button>
          <Button onClick={() => toast.error("Something went wrong!")}>Error Toast</Button>
          <Button onClick={() => toast.info("Here's some information for you.")}>Info Toast</Button>
          <Button onClick={() => toast.warning("Be careful with this action.")}>Warning Toast</Button>
          <Button onClick={handleAsyncOperation} disabled={isLoading}>
            Promise Toast
          </Button>
        </div>
      </div>
    </div>
  )
}
