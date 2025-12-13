"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { updateAgencyApiV1AgenciesMePut } from "@/generated/actions/agencies";
import { ActionError } from "@/generated/lib/safe-action";

interface AgencySettingsProps {
  agency: any | null;
  user: any;
}

export function AgencySettings({ agency, user }: AgencySettingsProps) {
  const [settings, setSettings] = useState({
    name: agency?.name || "",
    description: agency?.description || "",
    email: agency?.email || user.email || "",
    phone: agency?.phone_number || "",
    website: agency?.website || "",
    address: agency?.address || "",
    city: agency?.city || "",
    country: agency?.country || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAgencyApiV1AgenciesMePut({
        name: settings.name,
        description: settings.description,
        email: settings.email,
        phone_number: settings.phone,
        website: settings.website || undefined,
        address: settings.address,
        city: settings.city,
        country: settings.country,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      if (error instanceof ActionError && error.code === 'NOT_IMPLEMENTED') {
        toast.info("Agency API is not yet available. Settings will be saved once the backend is implemented.");
        console.log("Agency settings (API not available):", settings);
      } else {
        toast.error("Failed to save settings");
        console.error("Error saving agency settings:", error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!agency && (
        <Card className="rounded-[18px] border border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Agency API endpoints are not yet available. 
              Settings will be saved once the backend is implemented.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
          <CardDescription>
            Update your agency profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agency Name</Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="Your Agency Name"
              className="rounded-[18px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="Describe your agency"
              className="rounded-[18px] min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="agency@example.com"
                className="rounded-[18px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="rounded-[18px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              placeholder="https://your-agency.com"
              className="rounded-[18px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Street address"
              className="rounded-[18px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                placeholder="City"
                className="rounded-[18px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={settings.country}
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                placeholder="Country"
                className="rounded-[18px]"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-[18px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AgencySettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-[18px]" />
      <Skeleton className="h-96 w-full rounded-[18px]" />
    </div>
  );
}

