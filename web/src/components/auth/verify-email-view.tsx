"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Mail, ArrowRight, CheckCircle2, OctagonAlert, Loader2 } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { apiClient } from "@/generated/client";

export function VerifyEmailView() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || null;
  const email = searchParams?.get("email") || null;

  useEffect(() => {
    if (code) {
      verifyEmail(code);
    } else {
      setStatus("pending");
    }
  }, [code]);

  const verifyEmail = async (verificationCode: string) => {
    try {
      await apiClient.users.verifyEmailApiV1UsersEmailVerifyPost({
        body: { code: verificationCode },
      });

      setStatus("success");
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail?.[0]?.msg ||
        err?.message ||
        "Verification failed. The link may be expired."
      );
      setStatus("error");
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    try {
      await apiClient.users.resendEmailVerificationApiV1UsersEmailResendVerificationPost();

      setStatus("pending");
      setError(null);
    } catch (err: any) {
      setError("Failed to resend verification email. Please try again.");
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
          <div className="space-y-6 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="size-12 text-primary mx-auto animate-spin" />
                <div className="space-y-2">
                  <h1 className="text-3xl font-medium tracking-tight">Verifying email...</h1>
                  <p className="text-muted-foreground text-sm font-light">
                    Please wait while we verify your email address
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="size-12 text-primary mx-auto" />
                <div className="space-y-2">
                  <h1 className="text-3xl font-medium tracking-tight">Email verified!</h1>
                  <p className="text-muted-foreground text-sm font-light">
                    Your email has been successfully verified. Redirecting to sign in...
                  </p>
                </div>
                <Link href="/auth/login">
                  <Button className="w-full h-11 rounded-[18px] font-light">
                    Go to sign in
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <OctagonAlert className="size-12 text-destructive mx-auto" />
                <div className="space-y-2">
                  <h1 className="text-3xl font-medium tracking-tight">Verification failed</h1>
                  <p className="text-muted-foreground text-sm font-light">
                    {error || "The verification link may be expired or invalid."}
                  </p>
                </div>
                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20 rounded-[18px] text-left">
                    <AlertTitle className="text-sm">{error}</AlertTitle>
                  </Alert>
                )}
                {email && (
                  <Button
                    onClick={resendVerification}
                    variant="outline"
                    className="w-full h-11 rounded-[18px] font-light"
                  >
                    Resend verification email
                  </Button>
                )}
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full h-11 rounded-[18px] font-light">
                    Back to sign in
                  </Button>
                </Link>
              </>
            )}

            {status === "pending" && (
              <>
                <Mail className="size-12 text-primary mx-auto" />
                <div className="space-y-2">
                  <h1 className="text-3xl font-medium tracking-tight">Verify your email</h1>
                  <p className="text-muted-foreground text-sm font-light">
                    {email
                      ? `We've sent a verification link to ${email}. Please check your inbox.`
                      : "Please check your email for the verification link."}
                  </p>
                </div>
                {email && (
                  <Button
                    onClick={resendVerification}
                    variant="outline"
                    className="w-full h-11 rounded-[18px] font-light"
                  >
                    Resend verification email
                  </Button>
                )}
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full h-11 rounded-[18px] font-light">
                    Back to sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

