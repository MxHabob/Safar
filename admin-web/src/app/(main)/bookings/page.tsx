import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { listBookingsApiV1AdminBookingsGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Bookings Management",
  description: "Manage platform bookings",
};

// Dynamic import for better code splitting
const BookingsPage = dynamic(
  () =>
    import("@/features/admin/bookings").then((mod) => ({
      default: mod.BookingsPage,
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
const getInitialBookingsData = cache(async () => {
  try {
    return await listBookingsApiV1AdminBookingsGet({
      query: { skip: 0, limit: 50 },
    });
  } catch {
    return null;
  }
});

export default async function Page() {
  // Fetch initial data on server for faster initial load
  const initialBookingsData = await getInitialBookingsData();

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <BookingsPage initialBookingsData={initialBookingsData?.data} />
    </Suspense>
  );
}

