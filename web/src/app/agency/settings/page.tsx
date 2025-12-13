import { Suspense } from "react";
import { Metadata } from "next";
import { AgencySettings, AgencySettingsLoading } from "@/features/agency/components/agency-settings";
import { getCurrentUser } from "@/lib/auth/server/session";
import { getAgencyApiV1AgenciesMeGet } from "@/generated/actions/agencies";
import { ActionError } from "@/generated/lib/safe-action";

export const metadata: Metadata = {
  title: "Agency Settings",
  description: "Manage your agency settings and preferences",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function AgencySettingsData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    const agency = await getAgencyApiV1AgenciesMeGet();
    return <AgencySettings agency={agency} user={user} />;
  } catch (error) {
    // Handle NOT_IMPLEMENTED errors gracefully
    if (error instanceof ActionError && error.code === 'NOT_IMPLEMENTED') {
      console.info("[Agency Settings] API not yet implemented");
    } else {
      console.error("[Agency Settings] Error:", error);
    }
    return <AgencySettings agency={null} user={user} />;
  }
}

export default function AgencySettingsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Agency Settings</h1>
          <p className="text-muted-foreground font-light">
            Manage your agency profile and preferences
          </p>
        </div>
        <Suspense fallback={<AgencySettingsLoading />}>
          <AgencySettingsData />
        </Suspense>
      </div>
    </div>
  );
}

