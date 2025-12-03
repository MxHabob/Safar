import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";
import { loadSearchParams } from "@/pages/posts/params";
import { PostsListHeader } from "@/pages/posts/components/posts-list-header";
import {
  DashboardPostsView,
  ErrorStatus,
  LoadingStatus,
} from "@/pages/posts/dashboard-posts-view";

export const metadata = {
  title: "Posts",
  description: "Posts",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  return (
    <>
      <PostsListHeader />
        <Suspense fallback={<LoadingStatus />}>
          <ErrorBoundary fallback={<ErrorStatus />}>
            <DashboardPostsView />
          </ErrorBoundary>
        </Suspense>
    </>
  );
};

export default page;
