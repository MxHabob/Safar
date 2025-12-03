import { Suspense } from "react";
import { getNotifications } from "@/lib/server/queries/notifications";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Notifications",
  description: "Your notifications",
};

export default async function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Suspense fallback={<PageSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}

async function NotificationsContent() {
  const notifications = await getNotifications();
  return <NotificationsList notifications={notifications} />;
}

