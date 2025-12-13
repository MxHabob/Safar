"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ActionButton } from "@/components/shared/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlert, Shield, ArrowRight } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { useAuth } from "@/lib/auth/client/provider";

const Verify2FASchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
  is_backup_code: z.boolean(),
});

export function Verify2FAView() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const userId = searchParams?.get("userId") || "";
  const { updateUser } = useAuth();

  const form = useForm({
    resolver: zodResolver(Verify2FASchema) as any,
    defaultValues: {
      code: "",
      is_backup_code: false,
    },
  });

  const { verify2FA } = useAuth();
  const [pending, setPending] = useState(false);

  const onSubmit = async (values: z.infer<typeof Verify2FASchema>) => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const result = await verify2FA({
        email,
        code: values.code,
        is_backup_code: values.is_backup_code,
      });

      if (result.success) {
        // Redirect to dashboard - user will be fetched automatically by useAuth
        router.push("/");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || "Invalid verification code. Please try again.");
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
              <Shield className="size-12 text-primary mx-auto" />
              <h1 className="text-3xl font-medium tracking-tight">Two-factor authentication</h1>
              <p className="text-muted-foreground text-sm font-light">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-light">Verification code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP
                            value={field.value}
                            onChange={field.onChange}
                            maxLength={6}
                            containerClassName="w-full justify-center"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_backup_code"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-light cursor-pointer">
                          Using backup code
                        </FormLabel>
                      </div>
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
                  loading={pending}
                  loadingText="Verifying..."
                  icon={ArrowRight}
                  className="w-full h-11 rounded-[18px] font-light"
                >
                  Verify
                </ActionButton>
              </form>
            </Form>

            <div className="text-center text-sm font-light">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

