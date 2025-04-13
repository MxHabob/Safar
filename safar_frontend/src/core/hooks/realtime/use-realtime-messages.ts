"use client"

import { useCallback, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/core/store"
import { markMessageRead } from "@/core/features/realtime/realtime-slice"
import { useWebSocket } from "./use-websocket"
import type { Message } from "@/core/types"

export function useRealtimeMessages() {
  const dispatch = useDispatch()
  const { send } = useWebSocket()
  const messages = useSelector((state: RootState) => state.realtime.messages)
  const currentUser = useSelector((state: RootState) => state.auth.user)

  // Convert messages object to array and sort by date
  const messagesList = useMemo(() => {
    return Object.values(messages).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [messages])

  // Get unread messages count
  const unreadCount = useMemo(() => {
    return messagesList.filter((msg) => !msg.is_read && msg.receiver === currentUser?.id).length
  }, [messagesList, currentUser])

  // Get conversations grouped by the other user
  const conversations = useMemo(() => {
    if (!currentUser) return []

    const conversationMap = new Map<string, Message[]>()

    messagesList.forEach((message) => {
      const otherUserId = message.sender === currentUser.id ? message.receiver : message.sender

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, [])
      }

      conversationMap.get(otherUserId)?.push(message)
    })

    // Sort conversations by most recent message
    return Array.from(conversationMap.entries())
      .map(([userId, messages]) => ({
        userId,
        messages: messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        lastMessage: messages[0],
        unreadCount: messages.filter((m) => !m.is_read && m.receiver === currentUser.id).length,
      }))
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
  }, [messagesList, currentUser])

  // Mark a message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      send("mark_message_read", { message_id: messageId })
      dispatch(markMessageRead(messageId))
    },
    [dispatch, send],
  )

  // Send a new message
  const sendMessage = useCallback(
    (receiverId: string, text: string) => {
      send("send_message", {
        receiver_id: receiverId,
        message_text: text,
      })
    },
    [send],
  )

  // Load more messages
  const loadMoreMessages = useCallback(
    (offset: number, limit = 20) => {
      send("get_more_messages", { offset, limit })
    },
    [send],
  )

  return {
    messages: messagesList,
    unreadCount,
    conversations,
    markAsRead,
    sendMessage,
    loadMoreMessages,
  }
}
