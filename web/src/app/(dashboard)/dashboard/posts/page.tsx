import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { Metadata } from "next";
import { loadSearchParams } from "@/pages/posts/params";
import { PostsListHeader } from "@/pages/posts/components/posts-list-header";
import {
  DashboardPostsView,
  LoadingStatus,
} from "@/pages/posts/dashboard-posts-view";

export const metadata: Metadata = {
  title: "Posts",
  description: "Manage and view your blog posts",
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
        <DashboardPostsView />
      </Suspense>
    </>
  );
};

export default page;
