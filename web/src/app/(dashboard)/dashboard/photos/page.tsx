import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";
import { loadSearchParams } from "@/pages/photos/params";
import { PhotosListHeader } from "@/pages/photos/components/photos-list-header";
import {
  DashboardPhotosView,
  ErrorStatus,
  LoadingStatus,
} from "@/pages/photos/dashboard-photos-view";

export const metadata = {
  title: "Photo Collection",
  description: "Photo Collection",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  return (
    <>
      <PhotosListHeader />
        <Suspense fallback={<LoadingStatus />}>
          <ErrorBoundary fallback={<ErrorStatus />}>
            <DashboardPhotosView />
          </ErrorBoundary>
        </Suspense>
    </>
  );
};

export default page;
