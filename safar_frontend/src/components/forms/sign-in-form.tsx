"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/redux/hooks/use-auth"
import { Spinner } from "../ui/spinner"
import { User } from "lucide-react"
import { loginSchema } from "@/lib/validations/auth"



type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login, socialLogin, isLoginLoading, isSocialAuthLoading } = useAuth()
  const [socialProvider, setSocialProvider] = useState<"google" | "facebook" | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    try {
      const result = await login(data)
      if (result.success) {
       
      }
    } catch {
      
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialProvider(provider)
    try {
      const code = "placeholder_auth_code"
      await socialLogin(provider, code)
    } finally {
      setSocialProvider(null)
    }
  }

  return (
    <Card className="border-none shadow-none sm:border sm:shadow">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/password-reset" className="text-xs text-muted-foreground hover:text-primary">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? <Spinner /> : null}
              Sign in
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            type="button"
            disabled={isSocialAuthLoading && socialProvider === "google"}
            onClick={() => handleSocialLogin("google")}
          >
            {isSocialAuthLoading && socialProvider === "google" ? (
              <Spinner />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isSocialAuthLoading && socialProvider === "facebook"}
            onClick={() => handleSocialLogin("facebook")}
          >
            {isSocialAuthLoading && socialProvider === "facebook" ? (
              <Spinner />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            Facebook
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center space-y-2 border-t px-6 py-4">
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </div>
        <div className="text-center text-xs">
          <Link href="/resend-activation" className="text-muted-foreground hover:text-primary">
            Didn&apos;t receive activation email?
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}