import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBooking } from "@/lib/server/queries/bookings";
import { BookingDetail } from "@/components/bookings/BookingDetail";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function BookingDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BookingContent id={id} />
    </Suspense>
  );
}

async function BookingContent({ id }: { id: string }) {
  const booking = await getBooking(id);
  
  if (!booking) {
    notFound();
  }
  
  return <BookingDetail booking={booking} />;
}

