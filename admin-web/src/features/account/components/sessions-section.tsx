"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetSessionsApiV1UsersSessionsGet, useRevokeSessionApiV1UsersSessionsSessionIdDeleteMutation, useLogoutAllApiV1UsersLogoutAllPostMutation } from "@/generated/hooks/users";
import { useModal } from "@/lib/stores/modal-store";
import { Monitor, Trash2, LogOut, Smartphone, Computer, Tablet, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SessionsSection() {
  const { data: sessions, refetch } = useGetSessionsApiV1UsersSessionsGet();
  const { onOpen } = useModal();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  const revokeSessionMutation = useRevokeSessionApiV1UsersSessionsSessionIdDeleteMutation({
    showToast: true,
    onSuccess: () => {
      refetch();
      setRevokingSessionId(null);
    },
  });

  const logoutAllMutation = useLogoutAllApiV1UsersLogoutAllPostMutation({
    showToast: true,
    onSuccess: () => {
      // Redirect to login after logging out all sessions
      window.location.href = "/login";
    },
  });

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await revokeSessionMutation.mutateAsync({ path: { session_id: sessionId } });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLogoutAll = async () => {
    setShowLogoutAllDialog(false);
    try {
      await logoutAllMutation.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Computer className="h-4 w-4" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  const sessionsList = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Active Sessions
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions and devices. You can revoke any session at any time.
          </p>
        </div>
        {sessionsList.length > 1 && (
          <Button
            onClick={() => setShowLogoutAllDialog(true)}
            variant="outline"
            className="rounded-xl h-9"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out All
          </Button>
        )}
      </div>

      {sessionsList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionsList.map((session: any) => {
            const isCurrentSession = session.is_current;
            const deviceInfo = session.device_info || {};
            const deviceName = deviceInfo.device_name || deviceInfo.user_agent || "Unknown Device";
            const location = session.location || "Unknown Location";

            return (
              <div
                key={session.session_id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{deviceName}</p>
                      {isCurrentSession && (
                        <Badge variant="outline" className="text-xs">
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {formatDate(session.last_activity)}
                    </p>
                    {session.ip_address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        IP: {session.ip_address}
                      </p>
                    )}
                  </div>
                </div>
                {!isCurrentSession && (
                  <Button
                    onClick={() => handleRevokeSession(session.session_id)}
                    variant="ghost"
                    size="sm"
                    disabled={revokingSessionId === session.session_id}
                    className="rounded-xl h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all devices and sessions. You'll need to sign in again on all devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={logoutAllMutation.isPending}
            >
              {logoutAllMutation.isPending ? "Signing out..." : "Sign Out All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

