import { Metadata } from "next";
import { BlogSlugView } from "@/pages/blog/blog-slug-view";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  // Decode URL-encoded params
  const decodedSlug = decodeURIComponent(slug);
  return {
    title: decodedSlug,
    description: decodedSlug,
  };
}

export default async function page({ params }: Props) {
  const slug = (await params).slug;
  // Decode URL-encoded params
  const decodedSlug = decodeURIComponent(slug);
  return (
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <BlogSlugView slug={decodedSlug} />
        </ErrorBoundary>
      </Suspense>
  );
}
