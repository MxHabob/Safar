"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal, openModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toastPromise } from "@/lib/toast-promise"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/date-formatter"
import { useUpdateBookingMutation } from "@/redux/services/api"

const formSchema = z.object({
  check_in: z.date().optional(),
  check_out: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function BookingModificationModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [updateBooking] = useUpdateBookingMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "BookingModification"
  const booking = data.Booking

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      check_in: booking?.check_in ? new Date(booking.check_in) : undefined,
      check_out: booking?.check_out ? new Date(booking.check_out) : undefined,
    },
  })

  const onClose = () => {
    dispatch(closeModal())
    form.reset()
  }

  const onSubmit = async (values: FormValues) => {
    if (!booking?.id) return

    setIsLoading(true)

    try {
      await toastPromise(
        updateBooking({
          id: booking.id,
          check_in: values.check_in?.toISOString(),
          check_out: values.check_out?.toISOString(),
        }).unwrap(),
        {
          loading: "Updating booking...",
          success: "Booking updated successfully!",
          error: (error) => `Failed to update booking: ${error.data?.message || "Unknown error"}`,
        },
      )

      dispatch(closeModal())
      dispatch(
        openModal({
          type: "SuccessOrFailure",
          data: {
            Booking: booking,
            success: true,
            message: "Booking updated successfully!",
          },
        }),
      )
    } catch (error) {
      console.error("Error updating booking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title="Modify Booking"
      description="Change the dates for this booking"
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            control={form.control}
            name="check_in"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Check-in Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value) : <span>Select date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="check_out"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Check-out Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value) : <span>Select date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const checkIn = form.getValues().check_in
                        return date < new Date() || (checkIn && date <= checkIn)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Booking
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  )
}
