"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/redux/hooks/useAuth"
import { Spinner } from "../ui/spinner"
import { registerSchema } from "@/lib/validations/auth"



type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { register, socialLogin, isRegisterLoading, isSocialAuthLoading } = useAuth()
  const [socialProvider, setSocialProvider] = useState<"google" | "facebook" | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      re_password: "",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    try {
      const result = await register(data)
      if (result.success) {
        
      
      } else {
        
      }
    } catch {
      
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialProvider(provider)
    try {
      const code = "placeholder_auth_code"
      const result = await socialLogin(provider, code)
      if (!result.success) {
        
      }
    } catch {
     
    } finally {
      setSocialProvider(null)
    }
  }

  return (
    <Card className="border-none shadow-none sm:border sm:shadow">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="re_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isRegisterLoading}>
              {isRegisterLoading && <Spinner className="mr-2" />}
              Create account
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
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
              <Spinner className="mr-2 h-4 w-4" />
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
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            Facebook
          </Button>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="text-center text-sm w-full">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}