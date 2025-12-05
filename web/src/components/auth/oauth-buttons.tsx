"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useOauthLoginApiV1UsersOauthLoginPostMutation } from "@/generated/hooks/users";
import { tokenStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Chrome, Apple } from "lucide-react";

type OAuthProvider = "google" | "apple" | "facebook" | "github";

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const router = useRouter();

  const oauthLoginMutation = useOauthLoginApiV1UsersOauthLoginPostMutation({
    showToast: false,
    onSuccess: (data) => {
      const expiresIn = data.expires_in || 1800;
      tokenStorage.setAccessToken(data.access_token, expiresIn);
      
      if (data.refresh_token) {
        tokenStorage.setRefreshToken(data.refresh_token);
      }

      router.push("/");
      setLoading(null);
    },
    onError: (error) => {
      if (onError) {
        onError(error.message || "Failed to login. Please try again.");
      }
      setLoading(null);
    },
  });

  const handleOAuthLogin = (provider: OAuthProvider) => {
    setLoading(provider);
    
    if (onError) {
      onError(`OAuth login with ${provider} requires provider SDK integration. Please use email/password login for now.`);
    }
    setLoading(null);
  };

  const handleOAuthCallback = (provider: OAuthProvider, token: string) => {
    setLoading(provider);
    oauthLoginMutation.mutate({
      provider: provider as any,
      token,
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-[18px] font-light"
        onClick={() => handleOAuthLogin("google")}
        disabled={loading !== null || oauthLoginMutation.isPending}
      >
        {loading === "google" || oauthLoginMutation.isPending ? (
          <>
            <Spinner className="size-4" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Chrome className="size-4" />
            <span>Continue with Google</span>
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-[18px] font-light"
        onClick={() => handleOAuthLogin("apple")}
        disabled={loading !== null || oauthLoginMutation.isPending}
      >
        {loading === "apple" || oauthLoginMutation.isPending ? (
          <>
            <Spinner className="size-4" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Apple className="size-4" />
            <span>Continue with Apple</span>
          </>
        )}
      </Button>
    </div>
  );
}

export async function handleOAuthCallback(provider: OAuthProvider, token: string) {
  return { provider, token };
}

