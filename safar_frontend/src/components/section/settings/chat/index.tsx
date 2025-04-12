"use client"

import { useEffect, useState } from "react"
import { useGetMessagesQuery } from "@/redux/services/api"
import type { Message, User } from "@/redux/types/types"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Wifi, WifiOff } from "lucide-react"
import { useRealTime } from "@/redux/hooks/use-real-time"
import { useModal } from "@/redux/hooks/use-modal"
import { useAuth } from "@/redux/hooks/usee-auth"
import { NewMessagePayload } from "@/redux/types/real-time"

// Group messages by conversation (sender/receiver pair)
interface Conversation {
  id: string
  otherUser: User
  lastMessage: Message
  unreadCount: number
  messages: Message[] // Ensure this is correctly typed as an array of Message
}

export const ChatInbox = () => {
  const { data: messagesData, isLoading } = useGetMessagesQuery({ page_size: 100 })
  const { user, isAuthenticated } = useAuth()
  console.log("messagedata:" ,messagesData)
  const { connectionState, unreadCount, markMessageAsRead } = useRealTime({
    onNewMessage: (data: NewMessagePayload) => {
      const message: Message = {
        ...data,
        is_read: false, // Default value or map appropriately
        updated_at: new Date().toISOString(), // Default value or map appropriately
        is_deleted: false, // Default value or map appropriately
      };
      // Add new message to conversations
      setConversations((prev) => {
        const conversationId = getConversationId(message.sender.id, message.receiver.id)
        const existingConversation = prev.find((c) => c.id === conversationId)

        if (existingConversation) {
          return prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: message,
                unreadCount: c.unreadCount + 1,
                messages: [...c.messages, message],
              }
            }
            return c
          })
        } else {
          // Create new conversation
          const otherUser = user?.id === message.sender.id ? message.receiver : message.sender
          return [
            ...prev,
            {
              id: conversationId,
              otherUser,
              lastMessage: message,
              unreadCount: 1,
              messages: [message],
            },
          ]
        }
      })
    },
  })
  const [conversations, setConversations] = useState<Conversation[]>([])
  const { onOpen } = useModal()
 

  const getConversationId = (user1Id: string, user2Id: string) => {
    return [user1Id, user2Id].sort().join("-")
  }

  useEffect(() => {
    if (messagesData?.results) {
      const currentUserId = user?.id || "";
      const conversationMap = new Map<string, Conversation>()

      messagesData.results.forEach((message) => {
        const otherUserId = message.sender.id === currentUserId ? message.receiver.id : message.sender.id
        const conversationId = getConversationId(currentUserId, otherUserId)
        const otherUser = message.sender.id === currentUserId ? message.receiver : message.sender

        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            otherUser,
            lastMessage: message,
            unreadCount: !message.is_read && message.sender.id !== currentUserId ? 1 : 0,
            messages: [message],
          })
        } else {
          const conversation = conversationMap.get(conversationId)!
          const isNewer = new Date(message.created_at) > new Date(conversation.lastMessage.created_at)

          conversationMap.set(conversationId, {
            ...conversation,
            lastMessage: isNewer ? message : conversation.lastMessage,
            unreadCount: conversation.unreadCount + (!message.is_read && message.sender.id !== currentUserId ? 1 : 0),
            messages: [...conversation.messages, message],
          })
        }
      })

      // Sort conversations by last message date (newest first)
      const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      })

      setConversations(sortedConversations)
    }
  }, [messagesData])

  const handleOpenChat = (conversation: Conversation) => {
    // Mark unread messages as read
    conversation.messages.forEach((message) => {
      if (!message.is_read && message.sender.id !== user?.id) {
        markMessageAsRead(message.id)
      }
    })

    // Update local state to reflect read status
    setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c)))

    // Open chat modal
    onOpen("ChatModel", {
      messages: conversation.messages as Message[],
      otherUser: conversation.otherUser,
    })
  }

  if (isLoading) {
    return <ChatInboxSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Conversations</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {connectionState === "connected" ? "Connected" : "Disconnected"}
          </span>
          {connectionState === "connected" ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground">When you have conversations, they will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleOpenChat(conversation)}
            >
              <div className="flex items-center p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                  <AvatarFallback>
                    {conversation.otherUser.first_name?.[0]}
                    {conversation.otherUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {conversation.otherUser.first_name} {conversation.otherUser.last_name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {/* {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })} */}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {conversation.lastMessage.message_text}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ChatInboxSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 flex-1">
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
