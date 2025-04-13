"use client"

import { useEffect, useState, useCallback } from "react"
import { useGetMessagesQuery } from "@/redux/services/api"
import type { Message, User } from "@/redux/types/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Wifi, WifiOff } from "lucide-react"
import { useRealTime } from "@/redux/hooks/use-real-time"
import { useModal } from "@/redux/hooks/use-modal"
import { useAuth } from "@/redux/hooks/use-auth"
import { NewMessagePayload } from "@/redux/types/real-time"

interface Conversation {
  id: string
  otherUser: User
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export const ChatInbox = () => {
  const { data: messagesData, isLoading } = useGetMessagesQuery({ page_size: 100 })
  const { user, isAuthenticated } = useAuth()
  const { connectionState, unreadCount, markMessageAsRead } = useRealTime({
    onNewMessage: (data: NewMessagePayload) => {
      const message: Message = {
        ...data,
        is_read: false,
        updated_at: new Date().toISOString(),
        is_deleted: false,
        // sender: undefined,
        // receiver: undefined,
        message_text: "",
        id: "",
        created_at: ""
      };
      setConversations((prev) => {
        const conversationId = getConversationId(message.sender.id, message.receiver.id)
        const existingConversation = prev.find((c) => c.id === conversationId)

        if (existingConversation) {
          return prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: message,
                unreadCount: c.unreadCount + (message.sender.id !== user?.id && !message.is_read ? 1 : 0),
                messages: [...c.messages, message],
              }
            }
            return c
          })
        } else {
          const otherUser = user?.id === message.sender.id ? message.receiver : message.sender
          return [
            ...prev,
            {
              id: conversationId,
              otherUser,
              lastMessage: message,
              unreadCount: message.sender.id !== user?.id && !message.is_read ? 1 : 0,
              messages: [message],
            },
          ]
        }
      })
    },
  })

  const [conversations, setConversations] = useState<Conversation[]>([])
  const { onOpen } = useModal()

  // Memoize the conversation ID generator
  const getConversationId = useCallback((user1Id: string, user2Id: string) => {
    return [user1Id, user2Id].sort().join("-")
  }, [])

  // Initialize conversations from API data
  useEffect(() => {
    if (messagesData?.results && user?.id) {
      const currentUserId = user.id
      const conversationMap = new Map<string, Conversation>()

      messagesData.results.forEach((message) => {
        const otherUserId = message.sender.id === currentUserId ? message.receiver.id : message.sender.id
        const conversationId = getConversationId(currentUserId, otherUserId)
        const otherUser = message.sender.id === currentUserId ? message.receiver : message.sender
        const isUnread = !message.is_read && message.sender.id !== currentUserId

        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            otherUser,
            lastMessage: message,
            unreadCount: isUnread ? 1 : 0,
            messages: [message],
          })
        } else {
          const conversation = conversationMap.get(conversationId)!
          const isNewer = new Date(message.created_at) > new Date(conversation.lastMessage.created_at)

          conversationMap.set(conversationId, {
            ...conversation,
            lastMessage: isNewer ? message : conversation.lastMessage,
            unreadCount: conversation.unreadCount + (isUnread ? 1 : 0),
            messages: [...conversation.messages, message],
          })
        }
      })

      const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      })

      setConversations(sortedConversations)
    }
  }, [messagesData, user?.id, getConversationId])

  const handleOpenChat = useCallback((conversation: Conversation) => {
    if (!user?.id) return

    const unreadMessages = conversation.messages.filter(
      (message) => !message.is_read && message.sender.id !== user.id
    )

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((message) => {
        markMessageAsRead(message.id)
      })

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        )
      )
    }

    onOpen("ChatModel", {
      messages: conversation.messages as Message[],
      otherUser: conversation.otherUser,
    })
  }, [user?.id, markMessageAsRead, onOpen])

  if (!isAuthenticated) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Please sign in to view messages</h3>
      </Card>
    )
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
                  <AvatarImage 
                    src={conversation.otherUser.profile?.avatar || `/placeholder.svg?height=48&width=48`} 
                    alt={`${conversation.otherUser.first_name} ${conversation.otherUser.last_name}`}
                  />
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
                      {new Date(conversation.lastMessage.created_at).toLocaleTimeString()}
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