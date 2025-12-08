import { Suspense } from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditListingForm } from "@/features/host/components/edit-listing-form";
import { getListingApiV1ListingsListingIdGet } from "@/generated/actions/listings";
import { getSession } from "@/lib/auth/session-provider";
import { Skeleton } from "@/components/ui/skeleton";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Listing ${id} - Safar`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const revalidate = 0;

async function EditListingPageContent({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession().catch(() => null);

  if (!session) {
    redirect("/login");
  }

  try {
    const listing = await getListingApiV1ListingsListingIdGet({
      path: { listing_id: id },
    });

    // Check if user owns this listing
    if (listing?.data?.host_id !== session.user.id && listing?.data?.host?.id !== session.user.id) {
      redirect("/dashboard");
    }

    return (
      <div className="min-h-screen w-full">
        <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Edit Listing</h1>
            <p className="text-muted-foreground font-light mt-2">
              Update your listing information
            </p>
          </div>

          <EditListingForm listing={listing.data} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

function EditListingLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full rounded-[18px]" />
      </div>
    </div>
  );
}

export default function EditListingPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<EditListingLoading />}>
      <EditListingPageContent params={params} />
    </Suspense>
  );
}

