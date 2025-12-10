import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { listListingsApiV1AdminListingsGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Listings Management",
  description: "Manage platform listings",
};

// Dynamic import for better code splitting
const ListingsPage = dynamic(
  () =>
    import("@/features/admin/listings").then((mod) => ({
      default: mod.ListingsPage,
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
const getInitialListingsData = cache(async () => {
  try {
    return await listListingsApiV1AdminListingsGet({
      query: { skip: 0, limit: 50 },
    });
  } catch {
    return null;
  }
});

export default async function Page() {
  // Fetch initial data on server for faster initial load
  const initialListingsData = await getInitialListingsData();

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ListingsPage initialListingsData={initialListingsData?.data} />
    </Suspense>
  );
}

