import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  TravelView,
  LoadingStatus,
} from "@/pages/travel-guides/travel-view";

export const metadata = {
  title: "Travel",
  description: "Travel",
};

const page = () => {
  return (
      <Suspense fallback={<LoadingStatus />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <TravelView />
        </ErrorBoundary>
      </Suspense>
  );
};

export default page;
