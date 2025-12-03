import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DiscoverView } from "@/pages/discover/discover-view";

export const metadata = {
  title: "Discover",
  description: "Discover",
};

const page = () => {
  return (
      <Suspense fallback={<p>Loading...</p>}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <DiscoverView />
        </ErrorBoundary>
      </Suspense>
  );
};

export default page;
