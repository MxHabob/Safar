"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ConversationList } from "./components/conversation-list";
import { MessageThread } from "./components/message-thread";
import { EmptyState } from "@/components/shared/empty-state";

export function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
            Messages
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-2">
            Chat with hosts and guests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 border rounded-[18px] p-4 overflow-y-auto">
            <ConversationList
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 border rounded-[18px] overflow-hidden">
            {selectedConversationId ? (
              <MessageThread conversationId={selectedConversationId} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={<MessageCircle className="h-12 w-12" />}
                  title="Select a conversation"
                  description="Choose a conversation from the list to start messaging."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

