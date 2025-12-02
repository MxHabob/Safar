import { Suspense } from "react";
import { getConversations } from "@/lib/server/queries/messages";
import { ConversationList } from "@/components/messages/ConversationList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Messages",
  description: "Your conversations",
};

export default async function MessagesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <Suspense fallback={<PageSkeleton />}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}

async function MessagesContent() {
  const conversations = await getConversations();
  return <ConversationList conversations={conversations} />;
}

