"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Spinner } from "../ui/spinner"
import { useAuth } from "@/redux/hooks/useAuth"

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ConfirmPasswordResetForm() {
  const { uid, token } = useParams() as { uid: string; token: string }
  const { confirmPasswordReset } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await confirmPasswordReset({
        uid,
        token,
        new_password: data.new_password,
      })

      if (result.success) {
        router.push("/auth/login?reset=success")
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-none sm:border sm:shadow">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">{error}</div>
            )}
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner /> : null}
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}