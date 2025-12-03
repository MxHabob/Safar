import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getConversation } from "@/lib/server/queries/messages";
import { MessageThread } from "@/components/messages/MessageThread";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ conversationId: string }>;

export default async function ConversationPage({ params }: { params: Params }) {
  const { conversationId } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConversationContent conversationId={conversationId} />
    </Suspense>
  );
}

async function ConversationContent({ conversationId }: { conversationId: string }) {
  const conversation = await getConversation(conversationId);
  
  if (!conversation) {
    notFound();
  }
  
  return <MessageThread conversation={conversation} />;
}

