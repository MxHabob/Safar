import { Suspense } from "react";
import { ResetPasswordView } from "@/features/auth/reset-password-view";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="relative bg-card border rounded-[18px] p-8 shadow-sm text-center">
            <p className="text-muted-foreground text-sm font-light">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordView />
    </Suspense>
  );
}

