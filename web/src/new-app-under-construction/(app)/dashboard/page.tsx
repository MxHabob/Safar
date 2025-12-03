import { Suspense } from "react";
import { getCurrentUser } from "@/lib/server/auth";
import { getBookings } from "@/lib/server/queries/bookings";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Dashboard",
  description: "Your dashboard",
};

export default async function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();
  const bookings = await getBookings({ limit: 5 });
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Welcome back, {user?.first_name}!</h2>
      </div>
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

