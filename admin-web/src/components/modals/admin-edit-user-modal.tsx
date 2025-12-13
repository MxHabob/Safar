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
import { useUpdateUserApiV1AdminUsersUserIdPutMutation } from "@/generated/hooks/admin"
import { useQueryClient } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"

const Schema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(["guest", "host", "admin", "super_admin", "agency"]).optional(),
  status: z.enum(["active", "inactive", "suspended", "pending_verification"]).optional(),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof Schema>

export function AdminEditUserModal() {
  const { isOpen, type, data, onClose } = useModal()
  const queryClient = useQueryClient()
  const isActive = isOpen && type === "adminEditUser"

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: (data?.payload as Partial<FormValues>) || {}
  })

  const isActiveValue = watch("is_active")

  const mutation = useUpdateUserApiV1AdminUsersUserIdPutMutation({ 
    showToast: true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listUsersApiV1AdminUsersGet"] })
      queryClient.invalidateQueries({ queryKey: ["getUserApiV1AdminUsersUserIdGet"] })
      if (data?.onSuccess) {
        data.onSuccess()
      }
      onClose()
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!data?.userId) return
    await mutation.mutateAsync({
      body: values,
      params: { path: { user_id: data.userId } },
    } as unknown as Parameters<typeof mutation.mutateAsync>[0])
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Save className="h-4 w-4" />
            </div>
            <DialogTitle>Edit user</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input {...register("email")} placeholder="user@example.com" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
                <Input {...register("first_name")} placeholder="First name" className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
                <Input {...register("last_name")} placeholder="Last name" className="rounded-xl h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Role</Label>
                <Select
                  value={watch("role") || ""}
                  onValueChange={(value) => setValue("role", value as FormValues["role"])}
                >
                  <SelectTrigger className="rounded-xl h-9 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Active Account</Label>
                <p className="text-xs text-muted-foreground">Enable or disable user account</p>
              </div>
              <Switch
                checked={isActiveValue ?? true}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending || isSubmitting} className="rounded-xl h-9 px-4 text-sm">
              Cancel
            </Button>
            <ActionButton
              type="submit"
              loading={mutation.isPending || isSubmitting}
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


