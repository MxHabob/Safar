"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
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
import { OctagonAlert, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { useResetPasswordApiV1UsersPasswordResetPostMutation } from "@/generated/hooks/users";

const ResetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ResetPasswordView() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams ? searchParams.get("code") : null;
  const email = searchParams ? searchParams.get("email") : null;

  useEffect(() => {
    if (!code || !email) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [code, email]);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useResetPasswordApiV1UsersPasswordResetPostMutation({
    showToast: false,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || "Failed to reset password. The token may be expired. Please request a new one.");
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
    if (!code || !email) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setError(null);
    resetPasswordMutation.mutate({
      email,
      code,
      new_password: values.password,
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="relative bg-card border rounded-[18px] p-8 shadow-sm text-center space-y-4">
            <CheckCircle2 className="size-12 text-primary mx-auto" />
            <h2 className="text-2xl font-medium">Password reset successful!</h2>
            <p className="text-muted-foreground text-sm font-light">
              Your password has been updated. Redirecting to sign in...
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
              <h1 className="text-3xl font-medium tracking-tight">Set new password</h1>
              <p className="text-muted-foreground text-sm font-light">
                Enter your new password below
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-light">New password</FormLabel>
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

                <ActionButton
                  type="submit"
                  loading={resetPasswordMutation.isPending}
                  loadingText="Resetting..."
                  icon={ArrowRight}
                  disabled={!code || !email}
                  className="w-full h-11 rounded-[18px] font-light"
                >
                  Reset password
                </ActionButton>
              </form>
            </Form>

            <div className="text-center text-sm font-light">
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Need a new reset link?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

