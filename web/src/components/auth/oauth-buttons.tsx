"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useOauthLoginApiV1UsersOauthLoginPostMutation } from "@/generated/hooks/users";
import { tokenStorage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Chrome, Apple } from "lucide-react";
import { loadGoogleScript, renderGoogleButton } from "@/lib/auth/google-oauth";

type OAuthProvider = "google" | "apple" | "facebook" | "github";

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get Google Client ID from environment or config
  useEffect(() => {
    // Try to get from environment variable
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      setGoogleClientId(clientId);
    } else {
      // If not in env, you might want to fetch it from your backend
      // For now, we'll show an error if it's not configured
      console.warn("Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.");
    }
  }, []);

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

  // Initialize Google Sign-In button
  useEffect(() => {
    if (googleClientId && googleButtonRef.current && !loading) {
      const initializeGoogleButton = async () => {
        try {
          await renderGoogleButton(
            googleButtonRef.current!,
            googleClientId,
            (idToken: string) => {
              setLoading("google");
              oauthLoginMutation.mutate({
                provider: "google" as any,
                token: idToken,
              });
            },
            (error: Error) => {
              if (onError) {
                onError(`Google Sign-In failed: ${error.message}`);
              }
              setLoading(null);
            }
          );
        } catch (error) {
          console.error("Failed to initialize Google button:", error);
          if (onError) {
            onError("Failed to initialize Google Sign-In. Please refresh the page.");
          }
        }
      };

      initializeGoogleButton();
    }
  }, [googleClientId, loading]);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (provider === "google") {
      if (!googleClientId) {
        if (onError) {
          onError("Google Sign-In is not configured. Please contact support.");
        }
        return;
      }

      try {
        setLoading("google");
        await loadGoogleScript(googleClientId);
        
        // Trigger Google Sign-In
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: { credential: string }) => {
              if (response.credential) {
                oauthLoginMutation.mutate({
                  provider: "google" as any,
                  token: response.credential,
                });
              } else {
                setLoading(null);
                if (onError) {
                  onError("No credential received from Google");
                }
              }
            },
          });
          
          // Prompt for sign-in
          window.google.accounts.id.prompt();
        } else {
          throw new Error("Google Identity Services not available");
        }
      } catch (error: any) {
        setLoading(null);
        if (onError) {
          onError(`Google Sign-In failed: ${error.message || "Unknown error"}`);
        }
      }
    } else if (provider === "apple") {
      setLoading(provider);
      if (onError) {
        onError("Apple Sign-In requires provider SDK integration. Please use email/password login for now.");
      }
      setLoading(null);
    } else {
      setLoading(provider);
      if (onError) {
        onError(`OAuth login with ${provider} requires provider SDK integration. Please use email/password login for now.`);
      }
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google Sign-In Button - Rendered by Google SDK */}
      <div ref={googleButtonRef} className="w-full flex justify-center">
        {/* Fallback button if Google SDK fails to render */}
        {!googleClientId && (
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
        )}
      </div>

      {/* Fallback manual Google button */}
      {googleClientId && (
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
      )}

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

