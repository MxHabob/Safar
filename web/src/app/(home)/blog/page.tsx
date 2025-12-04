import { Suspense } from "react";
import { Metadata } from "next";
import {
  TravelGuidesView,
  TravelGuidesViewLoadingStatus,
} from "@/pages/blog/blog-view";
import { getGuidesApiV1TravelGuidesGet } from "@/generated/actions/travelGuides";
import { ErrorBoundary } from "react-error-boundary";

export const metadata: Metadata = {
  title: "Blog",
  description: "Welcome to my blog, where I share my thoughts, experiences, and insights on a wide range of topics.",
  openGraph: {
    title: "Blog - Safar",
    description: "Welcome to my blog, where I share my thoughts, experiences, and insights on a wide range of topics.",
  },
};


export default async function BlogPage() {
  const data = await getGuidesApiV1TravelGuidesGet({
    query: {
      status: "published",
      limit: 20,
    },
  });
  
  return (
    <Suspense fallback={<TravelGuidesViewLoadingStatus />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <TravelGuidesView data={data?.data ?? []} />
      </ErrorBoundary>
    </Suspense>
  );
}
