import { Suspense } from "react";
import { Metadata } from "next";
import { HostSettings, HostSettingsLoading } from "@/features/host/components/host-settings";
import { getSession } from "@/lib/auth/session-provider";

export const metadata: Metadata = {
  title: "Settings - Host Dashboard",
  description: "Manage your host account settings and preferences",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function SettingsData() {
  const session = await getSession().catch(() => null);

  if (!session) {
    return null;
  }

  // Use session user directly - no need to call /api/v1/users/me
  // Session already contains user data from login/OAuth
  return <HostSettings user={session.user} />;
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Host Settings</h1>
          <p className="text-muted-foreground font-light">
            Manage your hosting preferences and account settings
          </p>
        </div>
        <Suspense fallback={<HostSettingsLoading />}>
          <SettingsData />
        </Suspense>
      </div>
    </div>
  );
}

