import { Metadata } from "next";
import { BlogSlugView, BlogSlugViewLoadingStatus } from "@/pages/blog/blog-slug-view";
import { Suspense } from "react";
import { getGuideApiV1TravelGuidesGuideIdGet } from "@/generated/actions/travelGuides";
import { notFound } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const decodedId = decodeURIComponent(id);
  
  try {
    const data = await getGuideApiV1TravelGuidesGuideIdGet({
      path: { guide_id: decodedId },
    });

    return {
      title: data?.data?.title || decodedId,
      description: data?.data?.summary || "Travel guide",
      openGraph: {
        title: data?.data?.title || decodedId,
        description: data?.data?.summary || "Travel guide",
        images: data?.data?.cover_image_url ? [data.data.cover_image_url] : [],
      },
    };
  } catch {
    return {
      title: decodedId,
      description: "Travel guide",
    };
  }
}


export default async function page({ params }: Props) {
  const id = (await params).id;
  const decodedId = decodeURIComponent(id);
  const data = await getGuideApiV1TravelGuidesGuideIdGet({
    path: { guide_id: decodedId },
  });

  if (!data) {
    notFound();
  }
  
  return (
    <Suspense fallback={<BlogSlugViewLoadingStatus />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <BlogSlugView id={decodedId} initialData={data?.data } />
      </ErrorBoundary>
    </Suspense>
  );
}
