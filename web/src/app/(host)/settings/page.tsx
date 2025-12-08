import { Suspense } from "react";
import { Metadata } from "next";
import { HostSettings, HostSettingsLoading } from "@/features/host/components/host-settings";
import { getCurrentUserInfoApiV1UsersMeGet } from "@/generated/actions/users";
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

  try {
    const userResult = await getCurrentUserInfoApiV1UsersMeGet().catch(() => null);
    const user = userResult?.data || session.user;

    return <HostSettings user={user} />;
  } catch (error) {
    return <HostSettings user={session.user} />;
  }
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

