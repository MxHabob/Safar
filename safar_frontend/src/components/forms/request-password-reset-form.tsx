"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/redux/hooks/use-auth"
import { Spinner } from "../ui/spinner"
import { resetPasswordSchema } from "@/lib/validations/auth"


type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function RequestPasswordResetForm() {
  const { requestPasswordReset, isRequestPasswordResetLoading } = useAuth()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    setError(null)
    try {
      const result = await requestPasswordReset(data.email)
      if (result.success) {
        setIsSuccess(true)
        form.reset()
      } else {
        setError(result.error || "Failed to send reset email")
      
      }
    } catch {
      setError("An unexpected error occurred")
    }
  }

  return (
    <Card className="border-none shadow-none sm:border sm:shadow">
      <CardContent className="pt-6">
        {isSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Password reset email sent! Please check your inbox and follow the instructions to reset your password.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-red-200 text-red-800 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRequestPasswordResetLoading}
              >
                {isRequestPasswordResetLoading ? <Spinner /> : null}
                Send reset link
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}