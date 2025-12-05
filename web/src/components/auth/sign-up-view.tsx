"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCreateSchema } from "@/generated/schemas";
import { useRegisterApiV1UsersRegisterPostMutation } from "@/generated/hooks/users";
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
import { OctagonAlert, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const SignUpSchema = UserCreateSchema.extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignUpView() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
    },
  });

  const registerMutation = useRegisterApiV1UsersRegisterPostMutation({
    showToast: false,
    onSuccess: (data, variables) => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/verify-email?email=" + encodeURIComponent(variables.email));
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (values: z.infer<typeof SignUpSchema>) => {
    setError(null);
    registerMutation.mutate({
      email: values.email,
      password: values.password,
      first_name: values.first_name || undefined,
      last_name: values.last_name || undefined,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="relative bg-card border rounded-[18px] p-8 shadow-sm text-center space-y-4">
            <CheckCircle2 className="size-12 text-primary mx-auto" />
            <h2 className="text-2xl font-medium">Account created!</h2>
            <p className="text-muted-foreground text-sm font-light">
              Please check your email to verify your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-medium tracking-tight">Create your account</h1>
              <p className="text-muted-foreground text-sm font-light">
                Start your travel journey with Safar
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-light">First name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              placeholder="John"
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
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-light">Last name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            className="h-11 rounded-[18px] border-input bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormLabel className="text-sm font-light">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="At least 8 characters"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-light">Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Confirm your password"
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
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account</span>
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
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                href="/auth/login"
                className="text-foreground hover:underline transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

