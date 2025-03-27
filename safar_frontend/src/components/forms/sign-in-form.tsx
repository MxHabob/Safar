"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plane } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/redux/hooks/useAuth"
import { Spinner } from "../ui/spinner"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login, socialLogin } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const result = await login(data)
      if (result.success) {
        router.push("/dashboard")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    if (provider === "google") {
      setIsGoogleLoading(true)
    } else if (provider === "facebook") {
      setIsFacebookLoading(true)
    }

    try {
      // This is a placeholder for the actual OAuth flow
      const code = "placeholder_auth_code"
      const result = await socialLogin(provider, code)

      if (result.success) {
        router.push("/dashboard")
      }
    } finally {
      setIsGoogleLoading(false)
      setIsFacebookLoading(false)
    }
  }

  return (
    <Card className="border-sky-100 bg-white/80 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-sky-100 p-3">
            <Plane className="h-6 w-6 text-sky-600" />
          </div>
        </div>

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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-sky-600">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} className="border-sky-200 focus:border-sky-500" />
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
              {isLoading ? <Spinner /> : <Plane className="mr-2 h-4 w-4" />}
              Continue Journey
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or travel with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            type="button"
            disabled={isGoogleLoading}
            onClick={() => handleSocialLogin("google")}
            className="border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            {isGoogleLoading ? (
              <Spinner />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isFacebookLoading}
            onClick={() => handleSocialLogin("facebook")}
            className="border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            {isFacebookLoading ? (
              <Spinner />
            ) : (
              <Icons.facebook className="mr-2 h-4 w-4" />
            )}
            Facebook
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center space-y-2 border-t border-sky-100 px-6 py-4">
        <div className="text-center text-sm">
          <span className="text-muted-foreground">New to Safar? </span>
          <Link href="/auth/register" className="font-medium text-sky-600 underline-offset-4 hover:underline">
            Start your journey
          </Link>
        </div>
        <div className="text-center text-xs">
          <Link href="/auth/resend-activation" className="text-muted-foreground hover:text-sky-600">
            Didn&apos;t receive activation email?
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

