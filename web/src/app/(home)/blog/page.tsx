import { Suspense } from "react";
import { Metadata } from "next";
import {
  TravelGuidesView,
  TravelGuidesViewLoadingStatus,
} from "@/pages/blog/blog-view";
import { getGuidesApiV1TravelGuidesGet } from "@/generated/actions/travelGuides";

export const metadata: Metadata = {
  title: "Blog",
  description: "Welcome to my blog, where I share my thoughts, experiences, and insights on a wide range of topics.",
  openGraph: {
    title: "Blog - Safar",
    description: "Welcome to my blog, where I share my thoughts, experiences, and insights on a wide range of topics.",
  },
};

async function BlogData() {
  try {
    const data = await getGuidesApiV1TravelGuidesGet({
      query: {
        status: "published",
        limit: 20,
      },
    });

    // Ensure data is always an array
    const guides = Array.isArray(data) ? data : [];
    
    return <TravelGuidesView data={guides} />;
  } catch (error) {
    console.error("Error fetching blog guides:", error);
    return <TravelGuidesView data={[]} />;
  }
}

const page = async () => {
  return (
    <Suspense fallback={<TravelGuidesViewLoadingStatus />}>
      <BlogData />
    </Suspense>
  );
};

export default page;
