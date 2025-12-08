"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
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
import { OctagonAlert, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { useRequestPasswordResetApiV1UsersPasswordResetRequestPostMutation } from "@/generated/hooks/users";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export function ForgotPasswordView() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const requestPasswordResetMutation = useRequestPasswordResetApiV1UsersPasswordResetRequestPostMutation({
    showToast: false,
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error) => {
      setError(error.message || "Failed to send reset email. Please try again.");
    },
  });

  const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
    setError(null);
    requestPasswordResetMutation.mutate({
      email: values.email,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="relative bg-background rounded-br-[18px] mb-8">
            <div className="pt-3 px-4 pb-3">
              <Link href="/login" className="text-sm font-light flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="rotate-180 size-4" />
                <span>Back to sign in</span>
              </Link>
            </div>
            <div className="absolute left-0 -bottom-[18px] size-[18px]">
              <Graphic />
            </div>
            <div className="absolute top-0 -right-[18px] size-[18px]">
              <Graphic />
            </div>
          </div>

          <div className="relative bg-card border rounded-[18px] p-8 shadow-sm text-center space-y-4">
            <CheckCircle2 className="size-12 text-primary mx-auto" />
            <h2 className="text-2xl font-medium">Check your email</h2>
            <p className="text-muted-foreground text-sm font-light">
              We've sent a password reset link to {form.getValues("email")}
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full h-11 rounded-[18px] font-light">
                Back to sign in
              </Button>
            </Link>
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
            <Link href="/login" className="text-sm font-light flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="rotate-180 size-4" />
              <span>Back to sign in</span>
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
              <h1 className="text-3xl font-medium tracking-tight">Reset password</h1>
              <p className="text-muted-foreground text-sm font-light">
                Enter your email address and we'll send you a link to reset your password
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

                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20 rounded-[18px]">
                    <OctagonAlert className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-sm">{error}</AlertTitle>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-[18px] font-light"
                  disabled={requestPasswordResetMutation.isPending}
                >
                  {requestPasswordResetMutation.isPending ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm font-light">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

