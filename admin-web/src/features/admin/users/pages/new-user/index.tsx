"use client";

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { useRegisterApiV1AuthRegisterPostMutation } from "@/generated/hooks/authentication"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"

const Schema = z.object({
  email: z.string().email(),
  full_name: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

export function NewUserPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(Schema)
  })
  const router = useRouter()
  const mutation = useRegisterApiV1AuthRegisterPostMutation({ showToast: true, onSuccess: () => router.push("/ai/admin/users") })

  const onSubmit = async (values: FormValues) => {
    await mutation.mutateAsync(values as Parameters<typeof mutation.mutateAsync>[0])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">New User</h1>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-xl">
          <div>
            <Label>Email</Label>
            <Input placeholder="user@example.com" {...register("email")} />
          </div>
          <div>
            <Label>Full name</Label>
            <Input placeholder="Full name" {...register("full_name")} />
          </div>
          <div>
            <Label>Company</Label>
            <Input placeholder="Company" {...register("company")} />
          </div>
          <div>
            <Label>Bio</Label>
            <Input placeholder="Bio" {...register("bio")} />
          </div>
          <div className="flex gap-2">
            <ActionButton
              type="submit"
              loading={mutation.isPending || isSubmitting}
              icon={UserPlus}
              loadingText="Creating..."
            >
              Create
            </ActionButton>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={mutation.isPending || isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
