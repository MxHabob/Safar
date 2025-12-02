import { Suspense } from "react";
import { getBookings } from "@/lib/server/queries/bookings";
import { BookingsList } from "@/components/bookings/BookingsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "My Bookings",
  description: "View your bookings",
};

type SearchParams = Promise<{ status?: string; page?: string }>;

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
      <Suspense fallback={<PageSkeleton />}>
        <BookingsContent searchParams={params} />
      </Suspense>
    </div>
  );
}

async function BookingsContent({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const bookings = await getBookings({
    status: searchParams.status as any,
    skip: searchParams.page ? (parseInt(searchParams.page) - 1) * 50 : 0,
    limit: 50,
  });
  
  return <BookingsList bookings={bookings.items} total={bookings.total} />;
}

