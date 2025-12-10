"use client"

//
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useModal } from "@/lib/stores/modal-store"
import { useChangePasswordApiV1AuthMeChangePasswordPostMutation } from "@/generated/hooks/authentication"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"

export function SetPasswordModal() {
  const { isOpen, type, onClose } = useModal()
  const isActive = isOpen && type === "setPassword"

  const PasswordSchema = z
    .object({
      current_password: z.string().min(8, "Password must be at least 8 characters"),
      new_password: z.string().min(8, "Password must be at least 8 characters"),
      confirm_password: z.string().min(8, "Confirm your password"),
    })
    .refine((vals) => vals.new_password === vals.confirm_password, {
      path: ["confirm_password"],
      message: "Passwords do not match",
    })

  type PasswordFormValues = z.infer<typeof PasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      current_password:"",
      new_password: "",
      confirm_password: "",
    },
  })

  const mutation = useChangePasswordApiV1AuthMeChangePasswordPostMutation({ showToast: true })

  const onSubmit = async (values: PasswordFormValues) => {
    await mutation.mutateAsync({ current_password: values.current_password, new_password: values.new_password })
    onClose()
  }

  return (
    <Dialog open={isActive} onOpenChange={(open) => (!open ? onClose() : undefined)} key={isActive ? "open" : "closed"}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Save className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg">Set password</DialogTitle>
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Current password"
              {...register("current_password")}
              className="rounded-xl h-9 text-sm"
            />
            {errors.current_password && (
              <p className="text-xs text-destructive">{errors.current_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="New password"
              {...register("new_password")}
              className="rounded-xl h-9 text-sm"
            />
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Confirm password"
              {...register("confirm_password")}
              className="rounded-xl h-9 text-sm"
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
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


