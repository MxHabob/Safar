"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { Label } from "@/components/ui/label"
import { useModal } from "@/lib/stores/modal-store"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const Schema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  price_per_night: z.number().positive().optional(),
  status: z.enum(["draft", "active", "inactive", "suspended", "pending_review"]).optional(),
})

type FormValues = z.infer<typeof Schema>

export function AdminEditListingModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isActive = isOpen && type === "adminEditListing"

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: (data?.payload as Partial<FormValues>) || {}
  })

  const onSubmit = async (values: FormValues) => {
    if (!data?.listingId) return
    
    try {
      // Note: There's no update listing endpoint in admin API, so we'll show a message
      // In a real scenario, you would call the appropriate API endpoint
      toast.info("Listing update functionality will be available soon")
      onClose()
    } catch (error) {
      toast.error("Failed to update listing")
    }
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Save className="h-4 w-4" />
            </div>
            <DialogTitle>Edit Listing</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Title</Label>
              <Input {...register("title")} placeholder="Listing title" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Price per Night</Label>
              <Input 
                type="number" 
                step="0.01"
                {...register("price_per_night", { valueAsNumber: true })} 
                placeholder="0.00" 
                className="rounded-xl h-9 text-sm" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select
                value={watch("status") || ""}
                onValueChange={(value) => setValue("status", value as FormValues["status"])}
              >
                <SelectTrigger className="rounded-xl h-9 text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-9 px-4 text-sm">
              Cancel
            </Button>
            <ActionButton
              type="submit"
              loading={isSubmitting}
              icon={Save}
              loadingText="Saving..."
              className="rounded-xl h-9 px-4 text-sm"
            >
              Save
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

