"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      // Show message that still offline
      alert("You are still offline. Please check your internet connection.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="rounded-[18px] border max-w-md w-full">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <WifiOff className="size-12 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-light">You're Offline</h1>
            <p className="text-muted-foreground font-light">
              It looks like you've lost your internet connection. Please check your network settings and try again.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="rounded-[18px] w-full"
              disabled={!navigator.onLine}
            >
              <RefreshCw className="size-4 mr-2" />
              {navigator.onLine ? "Retry" : "Still Offline"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="rounded-[18px] w-full"
            >
              Go to Home
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Some content may be available offline
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

