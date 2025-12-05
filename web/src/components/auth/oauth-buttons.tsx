"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiClient } from "@/generated/client";
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

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoading(provider);
    
    try {
      // For OAuth, we need to get the token from the provider first
      // This is a simplified version - in production, you'd use the provider's SDK
      // For now, we'll show an error message
      if (onError) {
        onError(`OAuth login with ${provider} requires provider SDK integration. Please use email/password login for now.`);
      }
    } catch (error: any) {
      if (onError) {
        onError(`Failed to login with ${provider}. Please try again.`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleOAuthCallback = async (provider: OAuthProvider, token: string) => {
    setLoading(provider);
    
    try {
      const response = await apiClient.users.oauthLoginApiV1UsersOauthLoginPost({
        body: {
          provider: provider as any,
          token,
        },
      });

      // Store tokens
      const data = response.data;
      const expiresIn = data.expires_in || 1800;
      tokenStorage.setAccessToken(data.access_token, expiresIn);
      
      // Store refresh token in localStorage
      if (data.refresh_token) {
        tokenStorage.setRefreshToken(data.refresh_token);
      }

      // Redirect to dashboard
      router.push("/");
    } catch (error: any) {
      if (onError) {
        onError(
          error?.response?.data?.detail ||
          error?.message ||
          `Failed to login with ${provider}. Please try again.`
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-[18px] font-light"
        onClick={() => handleOAuthLogin("google")}
        disabled={loading !== null}
      >
        {loading === "google" ? (
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
        disabled={loading !== null}
      >
        {loading === "apple" ? (
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

