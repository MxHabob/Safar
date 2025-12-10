import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { listPaymentsApiV1AdminPaymentsGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Payments Management",
  description: "Manage platform payments",
};

// Dynamic import for better code splitting
const PaymentsPage = dynamic(
  () =>
    import("@/features/admin/payments").then((mod) => ({
      default: mod.PaymentsPage,
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
const getInitialPaymentsData = cache(async () => {
  try {
    return await listPaymentsApiV1AdminPaymentsGet({
      query: { skip: 0, limit: 50 },
    });
  } catch {
    return null;
  }
});

export default async function Page() {
  // Fetch initial data on server for faster initial load
  const initialPaymentsData = await getInitialPaymentsData();

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PaymentsPage initialPaymentsData={initialPaymentsData?.data} />
    </Suspense>
  );
}

