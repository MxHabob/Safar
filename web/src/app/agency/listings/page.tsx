import { Suspense } from "react";
import { Metadata } from "next";
import { AgencyListingsView, AgencyListingsLoading } from "@/features/agency/components/agency-listings";
import { getCurrentUser } from "@/lib/auth/server/session";
import { listAgencyListingsApiV1AgenciesListingsGet } from "@/generated/actions/agencies";
import { ActionError } from "@/generated/lib/safe-action";

export const metadata: Metadata = {
  title: "Agency Listings",
  description: "Manage your agency listings",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function AgencyListingsData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    const result = await listAgencyListingsApiV1AgenciesListingsGet({ limit: 100 });
    const listings = result?.items || [];
    return <AgencyListingsView listings={listings} />;
  } catch (error) {
    // Handle NOT_IMPLEMENTED errors gracefully
    if (error instanceof ActionError && error.code === 'NOT_IMPLEMENTED') {
      console.info("[Agency Listings] API not yet implemented");
    } else {
      console.error("[Agency Listings] Error:", error);
    }
    return <AgencyListingsView listings={[]} />;
  }
}

export default function AgencyListingsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Agency Listings</h1>
          <p className="text-muted-foreground font-light">
            Manage all listings under your agency
          </p>
        </div>
        <Suspense fallback={<AgencyListingsLoading />}>
          <AgencyListingsData />
        </Suspense>
      </div>
    </div>
  );
}

