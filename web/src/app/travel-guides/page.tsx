import { Suspense } from "react";
import { getTravelGuides } from "@/lib/server/queries/travel-guides";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Travel Guides",
  description: "Discover travel guides and tips",
};

type SearchParams = Promise<{
  destination?: string;
  country?: string;
  city?: string;
  page?: string;
}>;

export default async function TravelGuidesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Travel Guides</h1>
      <Suspense fallback={<PageSkeleton />}>
        <TravelGuidesContent searchParams={params} />
      </Suspense>
    </div>
  );
}

async function TravelGuidesContent({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const guides = await getTravelGuides({
    destination: searchParams.destination,
    country: searchParams.country,
    city: searchParams.city,
    skip: searchParams.page ? (parseInt(searchParams.page) - 1) * 20 : 0,
    limit: 20,
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {guides.map((guide) => (
        <div key={guide.id} className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">{guide.title}</h2>
          <p className="text-muted-foreground">{guide.summary}</p>
        </div>
      ))}
    </div>
  );
}

