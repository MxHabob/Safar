import { Metadata } from "next";
import { Suspense } from "react";
import { CityView, CityViewLoadingStatus } from "@/features/travel-guides/index";
import { getGuidesApiV1TravelGuidesGet, getGuideApiV1TravelGuidesGuideIdGet } from "@/generated/actions/travelGuides";
import { notFound } from "next/navigation";
import { TravelGuideResponse } from "@/generated/schemas";

type Props = {
  params: Promise<{
    city: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = (await params).city;
  const decodedCity = decodeURIComponent(city);

  try {
    const guides = await getGuidesApiV1TravelGuidesGet({
      query: {
        city: decodedCity,
        status: "published",
        limit: 1,
      },
    });

    const guide = guides?.data?.[0];
    if (guide) {
      return {
        title: `${guide.city}, ${guide.country} - Safar`,
        description: guide.summary || `Travel guide for ${guide.city}, ${guide.country}`,
        keywords: [guide.city, guide.country, "travel guide", "destinations"],
        openGraph: {
          title: `${guide.city}, ${guide.country}`,
          description: guide.summary || `Travel guide for ${guide.city}, ${guide.country}`,
          images: guide.cover_image_url ? [guide.cover_image_url] : [],
          type: "website",
          siteName: "Safar",
        },
        twitter: {
          card: "summary_large_image",
          title: `${guide.city}, ${guide.country}`,
          description: guide.summary || `Travel guide for ${guide.city}, ${guide.country}`,
        },
        alternates: {
          canonical: `/travel/${encodeURIComponent(city)}`,
        },
      };
    }
  } catch {
    // Fall through to default metadata
  }

  return {
    title: `${decodedCity} - Safar`,
    description: `Travel guide for ${decodedCity}`,
  };
}

async function CityData({ city }: { city: string }) {
  try {
    // Try to get guide by ID/slug first (in case city param is actually an ID)
    let guide;
    try {
      guide = await getGuideApiV1TravelGuidesGuideIdGet({
        path: { guide_id: city },
      });
    } catch {
      // If that fails, try to find by city name
      const guides = await getGuidesApiV1TravelGuidesGet({
        query: {
          city: city,
          status: "published",
          limit: 1,
        },
      });
      guide = guides?.data?.[0];
    }

    if (!guide) {
      notFound();
    }

    return <CityView travelGuide={guide as TravelGuideResponse} />;
  } catch {
    notFound();
  }
}

const Page = async ({ params }: Props) => {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city);

  return (
    <Suspense fallback={<CityViewLoadingStatus />}>
      <CityData city={decodedCity} />
    </Suspense>
  );
};

export default Page;
