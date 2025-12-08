import { Suspense } from "react";
import { Metadata } from "next";
import { CreateListingForm } from "@/features/host/components/create-listing-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create New Listing",
  description: "Create a new listing for your property",
  robots: {
    index: false,
    follow: false,
  },
};

async function CreateListingPageContent() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Create New Listing</h1>
          <p className="text-muted-foreground font-light mt-2">
            Add your property to start hosting guests
          </p>
        </div>

        <CreateListingForm />
      </div>
    </div>
  );
}

function CreateListingLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96 w-full rounded-[18px]" />
      </div>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={<CreateListingLoading />}>
      <CreateListingPageContent />
    </Suspense>
  );
}

