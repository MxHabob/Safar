import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { getBookingApiV1AdminBookingsBookingIdGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Booking Details",
  description: "View and manage booking details",
};

// Dynamic import for better code splitting
const BookingDetailPage = dynamic(
  () =>
    import("@/features/admin/bookings/booking-detail").then((mod) => ({
      default: mod.BookingDetailPage,
    })),
  {
    loading: () => (
      <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: true,
  }
);

// Cache the data fetching function
const getBookingData = cache(async (bookingId: string) => {
  try {
    return await getBookingApiV1AdminBookingsBookingIdGet({
      path: { booking_id: bookingId },
    });
  } catch {
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch booking data on server
  const bookingData = await getBookingData(id);

  if (!bookingData?.data) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <BookingDetailPage initialBookingData={bookingData.data} />
    </Suspense>
  );
}

