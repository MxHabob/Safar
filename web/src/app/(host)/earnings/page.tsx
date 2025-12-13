import { Suspense } from "react";
import { Metadata } from "next";
import { HostEarnings, HostEarningsLoading } from "@/features/host/components/host-earnings";
import { listHostBookingsApiV1BookingsHostListingsGet } from "@/generated/actions/bookings";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Earnings - Host Dashboard",
  description: "View your earnings and revenue breakdown",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function EarningsData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    // Use server-side filtering via host bookings endpoint
    const bookingsResult = await listHostBookingsApiV1BookingsHostListingsGet({
      query: { limit: 100 },
    }).catch((error) => {
      console.error("[Host Earnings] Failed to fetch host bookings:", error);
      return { data: { items: [] } };
    });

    // Bookings are already filtered server-side
    const bookings = bookingsResult?.data?.items || [];

    return <HostEarnings bookings={bookings} />;
  } catch (error) {
    console.error("[Host Earnings] Unexpected error:", error);
    return <HostEarnings bookings={[]} />;
  }
}

export default function EarningsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Earnings</h1>
          <p className="text-muted-foreground font-light">
            Track your revenue and earnings over time
          </p>
        </div>
        <Suspense fallback={<HostEarningsLoading />}>
          <EarningsData />
        </Suspense>
      </div>
    </div>
  );
}

