"use client";

import { Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivacyMode, useInputModeActions } from "@/lib/stores/ui-store";

/**
 * PrivacyModeToggle Component
 * Toggles between Private and Public modes using Zustand store
 * 
 * @component
 * @example
 * ```tsx
 * <PrivacyModeToggle />
 * ```
 */
export function PrivacyModeToggle() {
  const privacyMode = usePrivacyMode();
  const { setPrivacyMode } = useInputModeActions();
  
  const isPrivate = privacyMode === "private";

  const toggleMode = () => {
    setPrivacyMode(isPrivate ? "public" : "private");
  };

  return (
    <Button
      variant="secondary"
      className="gap-1.5 px-3 py-1.5"
      onClick={toggleMode}
      aria-label={isPrivate ? "Private mode" : "Public mode"}
    >
      {isPrivate ? (
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span className="text-sm font-medium">
        {isPrivate ? "Private" : "Public"}
      </span>
    </Button>
  );
}

