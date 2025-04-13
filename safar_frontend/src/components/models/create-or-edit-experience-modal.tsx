"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { RootState } from "@/core/store"
import { useDispatch, useSelector } from "react-redux"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toastPromise } from "@/lib/toast-promise"
import { Loader2 } from "lucide-react"
import { closeModal } from "@/core/features/ui/modal-slice"
import { useCreateExperienceMutation, useUpdateExperienceMutation } from "@/core/services/api"


const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  price_per_person: z.coerce.number().positive("Price must be positive"),
  duration: z.coerce.number().positive("Duration must be positive"),
  capacity: z.coerce.number().positive("Capacity must be positive"),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateOrEditExperienceModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [createExperience] = useCreateExperienceMutation()
  const [updateExperience] = useUpdateExperienceMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "CreateOrEditExperience"
  const isEditMode = !!data.Experience?.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data.Experience?.title || "",
      description: data.Experience?.description || "",
      location: data.Experience?.location || "",
      price_per_person: data.Experience?.price_per_person || 0,
      duration: data.Experience?.duration || 0,
      capacity: data.Experience?.capacity || 0,
    },
  })

  const onClose = () => {
    dispatch(closeModal())
    form.reset()
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)

    try {
      if (isEditMode && data.Experience?.id) {
        await toastPromise(updateExperience({ id: data.Experience.id, ...values }).unwrap(), {
          loading: "Updating experience...",
          success: "Experience updated successfully!",
          error: (error) => `Failed to update experience: ${error.data?.message || "Unknown error"}`,
        })
      } else {
        await toastPromise(createExperience(values).unwrap(), {
          loading: "Creating experience...",
          success: "Experience created successfully!",
          error: (error) => `Failed to create experience: ${error.data?.message || "Unknown error"}`,
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
      title={isEditMode ? "Edit Experience" : "Create New Experience"}
      description={isEditMode ? "Update experience details" : "Add a new experience to your offerings"}
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Experience title" {...field} />
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
                  <Textarea placeholder="Describe this experience" {...field} />
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="price_per_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Person</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
