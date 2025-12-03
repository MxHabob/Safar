"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Listing error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Failed to load listing</h1>
      <p className="text-muted-foreground mb-8">
        {error.message || "An error occurred while loading this listing."}
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => router.push("/listings")}>
          Browse listings
        </Button>
      </div>
    </div>
  );
}

