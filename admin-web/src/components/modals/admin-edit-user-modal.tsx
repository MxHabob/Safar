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
import { Save } from "lucide-react"

const Schema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  username: z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

export function AdminEditUserModal() {
  const { isOpen, type, data, onClose } = useModal()
  const isActive = isOpen && type === "adminEditUser"

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: (data?.payload as Partial<FormValues>) || {}
  })

  const mutation = useUpdateUserApiV1AdminUsersUserIdPutMutation({ showToast: true })

  const onSubmit = async (values: FormValues) => {
    if (!data?.userId) return
    await mutation.mutateAsync({
      body: values,
      params: { path: { user_id: data.userId } },
    } as unknown as Parameters<typeof mutation.mutateAsync>[0])
    onClose()
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
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input {...register("email")} placeholder="user@example.com" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Full name</Label>
              <Input {...register("full_name")} placeholder="Full name" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Username</Label>
              <Input {...register("username")} placeholder="username" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Company</Label>
              <Input {...register("company")} placeholder="Company" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
              <Input {...register("bio")} placeholder="Bio" className="rounded-xl h-9 text-sm" />
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


