import { Metadata } from "next";
import { BlogSlugView } from "@/pages/blog/blog-slug-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  // Decode URL-encoded params
  const decodedId = decodeURIComponent(id);
  return {
    title: decodedId,
    description: decodedId,
  };
}

export default async function page({ params }: Props) {
  const id = (await params).id;
  // Decode URL-encoded params
  const decodedId = decodeURIComponent(id);
  return (
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <BlogSlugView id={decodedId} />
        </ErrorBoundary>
      </Suspense>
  );
}
