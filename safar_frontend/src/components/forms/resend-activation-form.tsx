"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "../ui/spinner"
import { useAuth } from "@/redux/hooks/useAuth"
import { resendActivationSchema } from "@/lib/validations/auth"



type ResendActivationFormValues = z.infer<typeof resendActivationSchema>

export function ResendActivationForm() {
  const { resendActivationEmail, isResendActivationLoading } = useAuth()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResendActivationFormValues>({
    resolver: zodResolver(resendActivationSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ResendActivationFormValues) {
    setError(null)
    try {
      const result = await resendActivationEmail(data.email)
      if (result.success) {
        setIsSuccess(true)
        form.reset()
      } else {
        setError(result.error || "Failed to send activation email")
       
      }
    } catch (err) {
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
              Activation email sent! Please check your inbox and follow the instructions to activate your account.
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
                disabled={isResendActivationLoading}
              >
                {isResendActivationLoading ? <Spinner /> : null}
                Resend activation email
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}