"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Login Button Component (Client Component)
 * Handles navigation to login page
 */
export function LoginButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-[18px]"
      onClick={() => {
        router.push("/auth/login");
      }}
      aria-label="Login"
    >
      Login
    </Button>
  );
}

