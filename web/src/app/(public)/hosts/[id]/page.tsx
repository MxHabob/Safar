import { Suspense } from "react";
import { Metadata } from "next";
import { HostProfileView, HostProfileLoading } from "@/features/hosts/host-profile-view";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";

type Params = Promise<{ id: string }>;

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Host Profile - Safar`,
    description: "View host profile and their listings",
    openGraph: {
      title: `Host Profile - Safar`,
      description: "View host profile and their listings",
      type: "profile",
      siteName: "Safar",
    },
    alternates: {
      canonical: `/hosts/${id}`,
    },
  };
}

export default async function HostProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  // Fetch initial data for faster initial load
  // Note: Currently fetches all active listings, should filter by host_id when API supports it
  const listingsResult = await listListingsApiV1ListingsGet({ 
    query: { skip: 0, limit: 12, status: "active" } 
  }).catch(() => null);
  
  const initialData = listingsResult?.data || undefined;

  return (
    <Suspense fallback={<HostProfileLoading />}>
      <HostProfileView hostId={id} initialData={initialData} />
    </Suspense>
  );
}

