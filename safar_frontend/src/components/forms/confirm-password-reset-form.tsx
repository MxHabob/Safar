"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Spinner } from "../ui/spinner"
import { useAuth } from "@/core/hooks/use-auth"
import { confirmPasswordResetSchema } from "@/lib/validations/auth"



type ResetPasswordFormValues = z.infer<typeof confirmPasswordResetSchema>

export function ConfirmPasswordResetForm() {
  const { uid, token } = useParams() as { uid: string; token: string }
  const { confirmPasswordReset, isConfirmPasswordResetLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: {
      new_password: "",
      re_new_password: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    setError(null)
    
    try {
      const result = await confirmPasswordReset({
        uid,
        token,
        new_password: data.re_password,
      })

      if (!result.success) {
        setError(result.error || "Failed to reset password")
      }
    } catch {
      setError("An unexpected error occurred")
    }
  }

  return (
    <Card className="border-none shadow-none sm:border sm:shadow">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                {error}
              </div>
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
              name="re_new_password"
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isConfirmPasswordResetLoading}
            >
              {isConfirmPasswordResetLoading ? <Spinner /> : null}
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}