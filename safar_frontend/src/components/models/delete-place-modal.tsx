"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { closeModal } from "@/core/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { useDeletePlaceMutation } from "@/core/services/api"
import { toastPromise } from "@/lib/toast-promise"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function DeletePlaceModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [deletePlace] = useDeletePlaceMutation()
  const [isLoading, setIsLoading] = useState(false)

  const isModalOpen = isOpen && type === "deletePlace"
  const place = data.Place

  const onClose = () => {
    dispatch(closeModal())
  }

  const onDelete = async () => {
    if (!place?.id) return

    setIsLoading(true)

    try {
      await toastPromise(deletePlace(place.id).unwrap(), {
        loading: "Deleting place...",
        success: "Place deleted successfully!",
        error: (error) => `Failed to delete place: ${error.data?.message || "Unknown error"}`,
      })
      onClose()
    } catch (error) {
      console.error("Error deleting place:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title="Delete Place"
      description="Are you sure you want to delete this place? This action cannot be undone."
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className="rounded-full bg-red-50 p-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium">{place?.name}</h3>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this place and all associated data.
          </p>
        </div>

        <div className="flex w-full justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
