import { Suspense } from "react";
import { Metadata } from "next";
import { HostProfileView, HostProfileLoading } from "@/features/hosts/host-profile-view";

type Params = Promise<{ id: string }>;

export const revalidate = 300;

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

  return (
    <Suspense fallback={<HostProfileLoading />}>
      <HostProfileView hostId={id} />
    </Suspense>
  );
}

