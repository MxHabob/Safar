import { Metadata } from "next";
import { Suspense } from "react";
import {  ErrorBoundary } from "react-error-boundary";
import { PostView } from "@/pages/posts/post-view";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  // Decode URL-encoded params
  const decodedSlug = decodeURIComponent(slug);

  return {
    title: "Post",
  };
}

const Page = async ({ params }: Props) => {
  const { slug } = await params;

  // Decode URL-encoded params
  const decodedSlug = decodeURIComponent(slug);

  return (
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <PostView slug={decodedSlug} />
        </Suspense>
      </ErrorBoundary>
  );
};

export default Page;
