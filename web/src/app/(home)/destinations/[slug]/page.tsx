import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationDetailView, DestinationDetailLoading } from "@/pages/destinations/destination-detail-view";
import { getGuidesApiV1TravelGuidesGet } from "@/generated/actions/travelGuides";

type Params = Promise<{ slug: string }>;

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const guides = await getGuidesApiV1TravelGuidesGet({
      query: {
        status: "published",
        limit: 100,
      },
    }).catch(() => []);

    const guide = Array.isArray(guides) 
      ? guides.find((g) => g.slug === slug || g.city?.toLowerCase() === slug.toLowerCase())
      : null;

    if (!guide) {
      return {
        title: "Destination Not Found - Safar",
      };
    }

    return {
      title: `${guide.city || guide.destination || "Destination"} - Safar`,
      description: guide.summary || `Travel guide for ${guide.city || guide.destination}`,
      keywords: ["destination", "travel guide", guide.city || "", guide.country || ""],
      openGraph: {
        title: `${guide.city || guide.destination} - Safar`,
        description: guide.summary || `Travel guide for ${guide.city || guide.destination}`,
        type: "article",
        siteName: "Safar",
        images: guide.cover_image_url ? [guide.cover_image_url] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${guide.city || guide.destination} - Safar`,
        description: guide.summary || `Travel guide`,
      },
      alternates: {
        canonical: `/destinations/${slug}`,
      },
    };
  } catch {
    return {
      title: "Destination - Safar",
    };
  }
}

/**
 * Destination detail page
 * Shows destination information and travel guides
 */
export default async function DestinationDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  return (
    <Suspense fallback={<DestinationDetailLoading />}>
      <DestinationDetailContent slug={slug} />
    </Suspense>
  );
}

async function DestinationDetailContent({ slug }: { slug: string }) {
  try {
    const guides = await getGuidesApiV1TravelGuidesGet({
      query: {
        status: "published",
        limit: 100,
      },
    }).catch(() => []);

    const guide = Array.isArray(guides)
      ? guides.find((g) => g.slug === slug || g.city?.toLowerCase() === slug.toLowerCase())
      : null;

    if (!guide) {
      notFound();
    }

    return <DestinationDetailView guide={guide} />;
  } catch (error) {
    console.error("Error fetching destination:", error);
    notFound();
  }
}

