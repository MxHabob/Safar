"use client";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/core/hooks/use-auth";
import { Google } from "../icon/google";
import { Loader } from "./loader";
import { continueWithGoogle } from "@/lib/utils";

export const GoogleAuthButton = () => {
  const { isLoading} = useAuth()
  const handleClick = () => {
    continueWithGoogle();
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full rounded-2xl flex gap-3 bg-[#09090B] border-[#27272A]"
      variant="outline"
      disabled={isLoading}
    >
      <Loader loading={isLoading}>
        <Google />
        Google
      </Loader>
    </Button>
  );
};
