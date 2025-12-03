import { Suspense } from "react";
import { getHostBookings } from "@/lib/server/queries/bookings";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Host Dashboard",
  description: "Your host dashboard",
};

export default async function HostDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Host Dashboard</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HostDashboardContent />
      </Suspense>
    </div>
  );
}

async function HostDashboardContent() {
  const bookings = await getHostBookings({ limit: 10 });
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="space-y-2">
          {bookings.items.map((booking) => (
            <div key={booking.id} className="border rounded p-4">
              <p>{booking.listing?.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

