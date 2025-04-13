"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { closeModal } from "@/core/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePlaceMutation, useUpdatePlaceMutation } from "@/core/services/api"
import { toastPromise } from "@/lib/toast-promise"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  price: z.coerce.number().positive("Price must be positive"),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateOrEditPlaceModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [createPlace] = useCreatePlaceMutation()
  const [updatePlace] = useUpdatePlaceMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "CreateOrEditPlace"
  const isEditMode = !!data.Place?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.Place?.name || "",
      description: data.Place?.description || "",
      location: data.Place?.location || "",
      price: data.Place?.price || 0,
    },
  })

  const onClose = () => {
    dispatch(closeModal())
    form.reset()
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)

    try {
      if (isEditMode && data.Place?.id) {
        await toastPromise(updatePlace({ id: data.Place.id, ...values }).unwrap(), {
          loading: "Updating place...",
          success: "Place updated successfully!",
          error: (error) => `Failed to update place: ${error.data?.message || "Unknown error"}`,
        })
      } else {
        await toastPromise(createPlace(values).unwrap(), {
          loading: "Creating place...",
          success: "Place created successfully!",
          error: (error) => `Failed to create place: ${error.data?.message || "Unknown error"}`,
        })
      }
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title={isEditMode ? "Edit Place" : "Create New Place"}
      description={isEditMode ? "Update place details" : "Add a new place to your listings"}
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Place name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe this place" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
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
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  )
}
