"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Compass, CheckCircle } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "../ui/spinner"
import { useAuth } from "@/redux/hooks/useAuth"

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function RequestPasswordResetForm() {
  const { requestPasswordReset } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true)
    try {
      const result = await requestPasswordReset(data.email)
      if (result.success) {
        setIsSuccess(true)
        form.reset()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-sky-100 bg-white/80 backdrop-blur">
      <CardContent className="pt-6">
        {!isSuccess && (
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-sky-100 p-3">
              <Compass className="h-6 w-6 text-sky-600" />
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-100 p-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <Alert className="bg-emerald-50 border-emerald-200">
              <AlertDescription className="text-emerald-800">
                We&apos;ve sent you directions! Check your inbox and follow the link to reset your password.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="traveler@example.com"
                        {...field}
                        className="border-sky-200 focus:border-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-emerald-500 hover:from-sky-700 hover:to-emerald-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner />
                ) : (
                  <Compass className="mr-2 h-4 w-4" />
                )}
                Send Reset Link
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}

