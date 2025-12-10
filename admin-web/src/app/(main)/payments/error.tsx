"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Payments page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Payments</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message || "An unexpected error occurred while loading payments."}
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={reset} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </Alert>
    </div>
  );
}

