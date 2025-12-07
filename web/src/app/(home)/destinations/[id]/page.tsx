import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationDetailView, DestinationDetailLoading } from "@/features/destinations/destination-detail-view";
import { getGuideApiV1TravelGuidesGuideIdGet } from "@/generated/actions/travelGuides";
import { TravelGuideResponse } from "@/generated/schemas";

type Params = Promise<{ id: string }>;

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const guide = await getGuideApiV1TravelGuidesGuideIdGet({
      path: {
        guide_id: id,
      },
    }).catch(() => null);

    
    return {
      title: `${guide?.data?.city || guide?.data?.country || "Destination"} - Safar`,
      description: guide?.data?.summary || `Travel guide for ${guide?.data?.city || guide?.data?.destination}`,
      keywords: ["destination", "travel guide", guide?.data?.city || "", guide?.data?.country || ""],
      openGraph: {
        title: `${guide?.data?.city || guide?.data?.destination} - Safar`,
        description: guide?.data?.summary || `Travel guide for ${guide?.data?.city || guide?.data?.destination}`,
        type: "article",
        siteName: "Safar",
        images: guide?.data?.cover_image_url ? [guide?.data?.cover_image_url] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${guide?.data?.city || guide?.data?.destination} - Safar`,
        description: guide?.data?.summary || `Travel guide`,
      },
      alternates: {
        canonical: `/destinations/${id}`,
      },
    };
  } catch {
    return {
      title: "Destination - Safar",
    };
  }
}

export default async function DestinationDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<DestinationDetailLoading />}>
      <DestinationDetailContent id={id} />
    </Suspense>
  );
}

async function DestinationDetailContent({ id }: { id: string }) {


  const guide = await getGuideApiV1TravelGuidesGuideIdGet({
    path: {
      guide_id: id,
    },
  }).catch(() => null);

  if (!guide) {
    notFound();
  }

  return <DestinationDetailView guide={guide.data as TravelGuideResponse} />;
}

