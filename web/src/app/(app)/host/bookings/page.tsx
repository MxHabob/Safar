import { Suspense } from "react";
import { getHostBookings } from "@/lib/server/queries/bookings";
import { HostBookingsList } from "@/components/bookings/HostBookingsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Host Bookings",
  description: "Manage your bookings",
};

type SearchParams = Promise<{ status?: string; page?: string }>;

export default async function HostBookingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Host Bookings</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HostBookingsContent searchParams={params} />
      </Suspense>
    </div>
  );
}

async function HostBookingsContent({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const bookings = await getHostBookings({
    status: searchParams.status as any,
    skip: searchParams.page ? (parseInt(searchParams.page) - 1) * 50 : 0,
    limit: 50,
  });
  
  return <HostBookingsList bookings={bookings.items} total={bookings.total} />;
}

