"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, Loader2 } from "lucide-react";
import { useGetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet } from "@/generated/hooks/messages";
import { useCreateMessageApiV1MessagesPostMutation } from "@/generated/hooks/messages";
import { useMarkConversationReadApiV1MessagesConversationsConversationIdReadPostMutation } from "@/generated/hooks/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/client";
import { useWebSocket } from "@/lib/websocket/use-websocket";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface MessageThreadProps {
  conversationId: string;
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useGetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGet(
    conversationId,
    0,
    50
  );

  const createMessageMutation = useCreateMessageApiV1MessagesPostMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["getConversationsApiV1MessagesConversationsGet"] });
    },
    showToast: false,
  });

  const markReadMutation = useMarkConversationReadApiV1MessagesConversationsConversationIdReadPostMutation({
    showToast: false,
  });

  // WebSocket connection for real-time messages
  const wsUrl = user?.id
    ? `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/api/v1/messages/ws/${user.id}`
    : null;

  const { lastMessage, isConnected } = useWebSocket(wsUrl, {
    onMessage: (wsMessage) => {
      if (wsMessage.type === "new_message") {
        // Check if message belongs to current conversation
        const messageData = wsMessage.message;
        if (messageData?.conversation_id === conversationId) {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["getConversationsApiV1MessagesConversationsGet"] });
        }
      }
    },
  });

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId) {
      markReadMutation.mutate({ path: { conversation_id: conversationId } });
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    createMessageMutation.mutate({
      conversation_id: conversationId,
      body: message.trim(),
    });
  };

  if (isLoading) {
    return <MessageThreadLoading />;
  }

  const messages = messagesData?.items || [];

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs font-light">
          Reconnecting to real-time messaging...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-12 w-12" />}
            title="No messages yet"
            description="Start the conversation by sending a message."
          />
        ) : (
          messages.map((msg) => {
            const isOwnMessage = String(msg.sender_id) === String(user?.id);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                {!isOwnMessage && (
                  <div className="relative size-8 rounded-full overflow-hidden bg-muted shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <MessageCircle className="size-4" />
                    </div>
                  </div>
                )}

                <Card
                  className={cn(
                    "rounded-[18px] border max-w-[70%]",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-light whitespace-pre-wrap wrap-break-word">
                      {msg.body}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1 font-light",
                        isOwnMessage
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="rounded-[18px] flex-1"
            disabled={createMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-[18px]"
            disabled={!message.trim() || createMessageMutation.isPending}
          >
            {createMessageMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageThreadLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-[18px]" />
        ))}
      </div>
      <div className="p-4 border-t">
        <Skeleton className="h-10 rounded-[18px]" />
      </div>
    </div>
  );
}

