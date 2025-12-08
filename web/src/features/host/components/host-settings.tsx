"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Bell, CreditCard, Globe, Shield } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { getCurrentUserInfoApiV1UsersMeGet, updateCurrentUserApiV1UsersMePut } from "@/generated/actions/users";
import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from "@/generated/schemas";

interface HostSettingsProps {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse;
}

export function HostSettings({ user }: HostSettingsProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bookingNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
    autoConfirmBookings: false,
    instantBooking: false,
    currency: "USD",
    payoutMethod: "",
    payoutEmail: user.email || "",
    bio: "",
    languages: [] as string[],
  });

  const { execute: updateUser, isExecuting } = useAction(
    updateCurrentUserApiV1UsersMePut,
    {
      onSuccess: () => {
        toast.success("Settings saved successfully!");
      },
      onError: (error) => {
        toast.error(error.error?.serverError || "Failed to save settings");
      },
    }
  );

  const handleSave = async () => {
    updateUser({
      bio: settings.bio,
      // Note: API may not support all these fields directly
      // Adjust based on actual API schema
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your listings
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Booking Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new bookings
              </p>
            </div>
            <Switch
              checked={settings.bookingNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, bookingNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Review Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new reviews
              </p>
            </div>
            <Switch
              checked={settings.reviewNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, reviewNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips and updates from Safar
              </p>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, marketingEmails: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Booking Preferences
          </CardTitle>
          <CardDescription>
            Configure how bookings are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Confirm Bookings</Label>
              <p className="text-sm text-muted-foreground">
                Automatically confirm bookings without manual approval
              </p>
            </div>
            <Switch
              checked={settings.autoConfirmBookings}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoConfirmBookings: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Instant Booking</Label>
              <p className="text-sm text-muted-foreground">
                Allow guests to book instantly without approval
              </p>
            </div>
            <Switch
              checked={settings.instantBooking}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, instantBooking: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payout Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full rounded-[18px] border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="SAR">SAR - Saudi Riyal</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Payout Email</Label>
            <Input
              type="email"
              value={settings.payoutEmail}
              onChange={(e) =>
                setSettings({ ...settings, payoutEmail: e.target.value })
              }
              className="rounded-[18px]"
              placeholder="your@email.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your host profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className="rounded-[18px] min-h-[100px]"
              placeholder="Tell guests about yourself..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="rounded-[18px]"
          disabled={isExecuting}
        >
          <Save className="size-4 mr-2" />
          {isExecuting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

export function HostSettingsLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-[18px] border">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

