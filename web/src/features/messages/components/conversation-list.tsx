"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Clock, Check, CheckCheck } from "lucide-react";
import { useGetConversationsApiV1MessagesConversationsGet } from "@/generated/hooks/messages";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/client";

interface ConversationListProps {
  selectedConversationId?: number;
  onSelectConversation?: (conversationId: number) => void;
}

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useAuth();
  const { data, isLoading, error } = useGetConversationsApiV1MessagesConversationsGet(
    0,
    50
  );

  if (isLoading) {
    return <ConversationListLoading />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="Error loading conversations"
        description="Unable to load your conversations. Please try again."
      />
    );
  }

  const conversations = data?.items || [];

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="No conversations"
        description="Start a conversation by messaging a host or guest."
      />
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        // Participants are user IDs (strings), find the other participant
        const otherParticipantId = conversation.participants?.find(
          (p) => p !== user?.id
        );
        // Get last message from messages array
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];
        // Calculate unread count (messages not read by current user)
        const unreadCount = conversation.messages?.filter(
          (msg) => msg.sender_id !== user?.id && !msg.is_read
        ).length || 0;
        const isSelected = selectedConversationId === Number(conversation.id);

        return (
          <Card
            key={conversation.id}
            className={cn(
              "rounded-[18px] border cursor-pointer transition-all hover:border-foreground/20",
              isSelected && "border-foreground/40 bg-muted/50"
            )}
            onClick={() => onSelectConversation?.(Number(conversation.id))}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative size-12 rounded-full overflow-hidden bg-muted shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <MessageCircle className="size-6" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-light text-sm truncate">
                      {otherParticipantId ? `User ${otherParticipantId}` : "Unknown User"}
                    </h3>
                    {lastMessage?.created_at && (
                      <span className="text-xs text-muted-foreground font-light shrink-0 ml-2">
                        {formatMessageTime(lastMessage.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {lastMessage ? (
                      <>
                        {lastMessage.sender_id === String(user?.id) ? (
                          <div className="flex items-center gap-1">
                            {lastMessage.is_read ? (
                              <CheckCheck className="size-3 text-blue-500" />
                            ) : (
                              <Check className="size-3 text-muted-foreground" />
                            )}
                          </div>
                        ) : null}
                        <p className="text-sm text-muted-foreground font-light truncate flex-1">
                          {lastMessage.body}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground font-light italic">
                        No messages yet
                      </p>
                    )}
                    {unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="rounded-full size-5 flex items-center justify-center p-0 text-xs shrink-0"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ConversationListLoading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-[18px]" />
      ))}
    </div>
  );
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

