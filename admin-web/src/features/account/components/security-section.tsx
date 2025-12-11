"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetCurrentUserInfoApiV1UsersMeGet, useGet2faStatusApiV1Users2faStatusGet, useDisable2faApiV1Users2faDisablePostMutation, useResendEmailVerificationApiV1UsersEmailResendVerificationPostMutation } from "@/generated/hooks/users";
import { GetCurrentUserInfoApiV1UsersMeGetResponse } from "@/generated/schemas";
import { useModal } from "@/lib/stores/modal-store";
import { Shield, Key, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SecuritySectionProps {
  initialUser?: GetCurrentUserInfoApiV1UsersMeGetResponse;
}

export function SecuritySection({ initialUser }: SecuritySectionProps) {
  const { data: user } = useGetCurrentUserInfoApiV1UsersMeGet({
    initialData: initialUser,
  });

  const { data: mfaStatus } = useGet2faStatusApiV1Users2faStatusGet();

  const { onOpen } = useModal();

  const disableMfaMutation = useDisable2faApiV1Users2faDisablePostMutation({
    showToast: true,
  });

  const resendEmailMutation = useResendEmailVerificationApiV1UsersEmailResendVerificationPostMutation({
    showToast: true,
    onSuccess: () => {
      toast.success("Verification email sent successfully");
    },
  });

  const handleEnableMfa = () => {
    onOpen("enableMfaConfirm");
  };

  const handleDisableMfa = async () => {
    if (confirm("Are you sure you want to disable multi-factor authentication? This will make your account less secure.")) {
      try {
        await disableMfaMutation.mutateAsync({ current_password: "", new_password: "" });
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleChangePassword = () => {
    onOpen("setPassword");
  };

  const isMfaEnabled = mfaStatus?.enabled || false;

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Password</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Change your password to keep your account secure
            </p>
          </div>
          <Button
            onClick={handleChangePassword}
            variant="outline"
            className="rounded-xl h-9"
          >
            Change Password
          </Button>
        </div>
      </div>

      <Separator />

      {/* Multi-Factor Authentication Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Multi-Factor Authentication</h3>
              {isMfaEnabled && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account with two-factor authentication
            </p>
            {isMfaEnabled && (
              <div className="mt-2 rounded-lg bg-muted/30 border p-3 text-sm">
                <p className="text-muted-foreground">
                  MFA is currently enabled. You'll need to verify your identity with an authenticator app when signing in.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {isMfaEnabled ? (
              <Button
                onClick={handleDisableMfa}
                variant="outline"
                className="rounded-xl h-9"
                disabled={disableMfaMutation.isPending}
              >
                {disableMfaMutation.isPending ? "Disabling..." : "Disable MFA"}
              </Button>
            ) : (
              <Button
                onClick={handleEnableMfa}
                variant="default"
                className="rounded-xl h-9"
              >
                <Shield className="h-4 w-4 mr-2" />
                Enable MFA
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Email Verification */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Email Verification</h3>
              {user?.is_email_verified ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Verify your email address to secure your account
            </p>
          </div>
          {!user?.is_email_verified && (
            <Button
              variant="outline"
              className="rounded-xl h-9"
              onClick={() => {
                resendEmailMutation.mutate({ email: user?.email || "" });
              }}
              disabled={resendEmailMutation.isPending}
            >
              {resendEmailMutation.isPending ? "Sending..." : "Resend Verification"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

