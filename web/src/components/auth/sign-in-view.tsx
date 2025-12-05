"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserLoginSchema } from "@/generated/schemas";
import { useAuth } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlert, Mail, Lock, ArrowRight } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function SignInView() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof UserLoginSchema>>({
    resolver: zodResolver(UserLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof UserLoginSchema>) => {
    setError(null);
    setPending(true);

    try {
      const result = await login({
        email: values.email,
        password: values.password,
      });
      
      // Check if 2FA is required
      if (result.requires2FA) {
        // Redirect to 2FA verification page
        const params = new URLSearchParams({
          email: values.email,
        });
        router.push(`/auth/verify-2fa?${params.toString()}`);
        return;
      }
      
      if (result.success) {
        // Successful login - redirect will happen automatically via useAuth
        router.push("/");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      // Handle different error types
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (err?.status === 423 || err?.message?.includes('locked')) {
        errorMessage = "Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.";
      } else if (err?.status === 403 || err?.message?.includes('inactive')) {
        errorMessage = err?.message || "Account is inactive or access denied.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Header with Safar design */}
        <div className="relative bg-background rounded-br-[18px] mb-8">
          <div className="pt-3 px-4 pb-3">
            <Link href="/" className="text-sm font-light flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="rotate-180 size-4" />
              <span>Back to home</span>
            </Link>
          </div>
          <div className="absolute left-0 -bottom-[18px] size-[18px]">
            <Graphic />
          </div>
          <div className="absolute top-0 -right-[18px] size-[18px]">
            <Graphic />
          </div>
        </div>

        {/* Auth Card */}
        <div className="relative bg-card border rounded-[18px] p-8 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-medium tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground text-sm font-light">
                Sign in to continue your journey with Safar
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-light">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="your.email@example.com"
                            type="email"
                            className="pl-10 h-11 rounded-[18px] border-input bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
                            {...field}
                          />
                        </div>
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
                        <FormLabel className="text-sm font-light">Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-light"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your password"
                            type="password"
                            className="pl-10 h-11 rounded-[18px] border-input bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20 rounded-[18px]">
                    <OctagonAlert className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-sm">{error}</AlertTitle>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-[18px] font-light"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-light">Or</span>
              </div>
            </div>

            <OAuthButtons onError={setError} />

            <div className="text-center text-sm font-light">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                href="/auth/register"
                className="text-foreground hover:underline transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

