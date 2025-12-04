"use client";

import { usePostsFilters } from "./hooks/use-posts-filters";
import { DataTable } from "@/components/shared/data-table";
import { columns } from "@/pages/posts/components/columns";
import { DataPagination } from "@/components/shared/data-pagination";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardPostsView = () => {
  const [filters, setFilters] = usePostsFilters();


  return (
    <>
      <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
        {0 === 0 ? (
          <EmptyStatus />
        ) : (
          <>
            <DataTable columns={columns} data={[]} />
            <DataPagination
              page={filters.page}
              totalPages={0}
              onPageChange={(page) => {
                setFilters({ page });
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

const EmptyStatus = () => {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>No posts found</EmptyTitle>
        <EmptyDescription>
          You have no posts. Create some posts to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
};

export const ErrorStatus = () => {
  return <div>Something went wrong</div>;
};

export const LoadingStatus = () => {
  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-6">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="h-3 w-[260px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
