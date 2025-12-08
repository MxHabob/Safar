import { Suspense } from "react";
import { Metadata } from "next";
import { BookingsView, BookingsLoading } from "@/features/bookings/bookings-view";

export const metadata: Metadata = {
  title: "My Bookings - Safar",
  description: "View and manage your bookings",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Bookings page
 * Displays all user bookings with filtering and management options
 */
export default function BookingsPage() {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Suspense fallback={<BookingsLoading />}>
          <BookingsView />
        </Suspense>
      </main>
    </div>
  );
}

