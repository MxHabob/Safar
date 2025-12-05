"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useOauthLoginApiV1UsersOauthLoginPostMutation } from "@/generated/hooks/users";
import { tokenStorage } from "@/lib/auth";
import { useAuth } from "@/lib/auth/client";
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
  const { updateUser } = useAuth();

  const oauthLoginMutation = useOauthLoginApiV1UsersOauthLoginPostMutation({
    showToast: false,
    onSuccess: (data) => {
      // Store tokens
      const expiresIn = data.expires_in || 1800;
      tokenStorage.setAccessToken(data.access_token, expiresIn);
      
      // Store refresh token in localStorage
      if (data.refresh_token) {
        tokenStorage.setRefreshToken(data.refresh_token);
      }

      // Redirect to dashboard - user will be fetched automatically by useAuth
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
    
    // For OAuth, we need to get the token from the provider first
    // This is a simplified version - in production, you'd use the provider's SDK
    // For now, we'll show an error message
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

// Export function to handle OAuth callback (to be used in callback route)
export async function handleOAuthCallback(provider: OAuthProvider, token: string) {
  // This function can be called from the OAuth callback route
  // Implementation would be similar to handleOAuthLogin but receives token from callback
  return { provider, token };
}

