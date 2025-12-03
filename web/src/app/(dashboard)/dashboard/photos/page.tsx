import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { Metadata } from "next";
import { loadSearchParams } from "@/pages/photos/params";
import { PhotosListHeader } from "@/pages/photos/components/photos-list-header";
import {
  DashboardPhotosView,
  LoadingStatus,
} from "@/pages/photos/dashboard-photos-view";

export const metadata: Metadata = {
  title: "Photo Collection",
  description: "Manage and view your photo collection",
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
        <DashboardPhotosView />
      </Suspense>
    </>
  );
};

export default page;
