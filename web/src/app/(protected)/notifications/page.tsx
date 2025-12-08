import { Suspense } from "react";
import { Metadata } from "next";
import { NotificationsPage, NotificationsPageLoading } from "@/features/notifications/notifications-page";

export const metadata: Metadata = {
  title: "Notifications - Safar",
  description: "View and manage your notifications",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsPageRoute() {
  return (
    <Suspense fallback={<NotificationsPageLoading />}>
      <NotificationsPage />
    </Suspense>
  );
}

