import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTravelStoryBySlug } from "@/lib/server/queries/travel-guides";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const story = await getTravelStoryBySlug(slug);
  
  if (!story) {
    return { title: "Story Not Found" };
  }
  
  return {
    title: story.title,
    description: story.content.substring(0, 160),
  };
}

export default async function TravelStoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TravelStoryContent slug={slug} />
    </Suspense>
  );
}

async function TravelStoryContent({ slug }: { slug: string }) {
  const story = await getTravelStoryBySlug(slug);
  
  if (!story) {
    notFound();
  }
  
  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">{story.title}</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />
    </article>
  );
}

