import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBooking } from "@/lib/server/queries/bookings";
import { HostBookingDetail } from "@/components/bookings/HostBookingDetail";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function HostBookingPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HostBookingContent id={id} />
    </Suspense>
  );
}

async function HostBookingContent({ id }: { id: string }) {
  const booking = await getBooking(id);
  
  if (!booking) {
    notFound();
  }
  
  return <HostBookingDetail booking={booking} />;
}

