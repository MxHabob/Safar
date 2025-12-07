import { Suspense } from "react";
import { Metadata } from "next";
import { MessagesPage } from "@/features/messages/messages-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Messages - Safar",
  description: "Chat with hosts and guests",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MessagesPageRoute() {
  return (
    <Suspense fallback={<MessagesPageLoading />}>
      <MessagesPage />
    </Suspense>
  );
}

function MessagesPageLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          <Skeleton className="lg:col-span-1 rounded-[18px]" />
          <Skeleton className="lg:col-span-2 rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}

