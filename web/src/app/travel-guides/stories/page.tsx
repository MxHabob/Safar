import { Suspense } from "react";
import { getTravelStories } from "@/lib/server/queries/travel-guides";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Travel Stories",
  description: "Read travel stories from our community",
};

export default async function TravelStoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Travel Stories</h1>
      <Suspense fallback={<PageSkeleton />}>
        <TravelStoriesContent />
      </Suspense>
    </div>
  );
}

async function TravelStoriesContent() {
  const stories = await getTravelStories({ limit: 20 });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stories.map((story) => (
        <div key={story.id} className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">{story.title}</h2>
          <p className="text-muted-foreground">{story.content.substring(0, 200)}...</p>
        </div>
      ))}
    </div>
  );
}

