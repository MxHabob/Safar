import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingDetailView, BookingDetailLoading } from "@/pages/bookings/booking-detail-view";
import { getSession } from "@/lib/auth/session-provider";

type Params = Promise<{ id: string }>;

export const revalidate = 30; // ISR: Revalidate every 30 seconds

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Booking ${id} - Safar`,
    description: "View your booking details and manage your reservation",
    robots: {
      index: false, // Don't index booking pages
      follow: false,
    },
  };
}

/**
 * Booking detail page
 * Shows booking information and management options
 */
export default async function BookingDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession().catch(() => null);

  if (!session) {
    notFound(); // Bookings require authentication
  }

  return (
    <Suspense fallback={<BookingDetailLoading />}>
      <BookingDetailView bookingId={id} />
    </Suspense>
  );
}

