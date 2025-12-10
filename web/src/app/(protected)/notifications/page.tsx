import dynamic from "next/dynamic";
import { Metadata } from "next";
import { NotificationsPageLoading } from "@/features/notifications/notifications-page";

const NotificationsPageView = dynamic(
  () =>
    import("@/features/notifications/notifications-page").then(
      (mod) => mod.NotificationsPage
    ),
  { loading: () => <NotificationsPageLoading /> }
);

export const metadata: Metadata = {
  title: "Notifications",
  description: "View and manage your notifications",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsPageRoute() {
  return <NotificationsPageView />;
}

