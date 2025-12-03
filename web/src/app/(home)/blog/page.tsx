import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  BlogView,
} from "@/pages/blog/blog-view";

export const metadata = {
  title: "Blog",
  description: "Blog",
};

const page = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <BlogView />
      </ErrorBoundary>
    </Suspense>
  );
};

export default page;
