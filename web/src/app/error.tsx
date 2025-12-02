"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-muted-foreground mb-8">
        We encountered an unexpected error. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

