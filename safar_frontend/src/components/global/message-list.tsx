"use client"

import { useEffect, useState } from "react"
import { useRealtimeMessages } from "@/core/hooks/realtime/use-realtime-messages"
import { usePresence } from "@/core/hooks/realtime/use-presence"
import type { Message } from "@/core/types"
import { useAuth } from "@/core/hooks/use-auth"

interface MessageListProps {
  userId: string
}

export default function MessageList({ userId }: MessageListProps) {
  const {user : currentUser} = useAuth()
  const { conversations, markAsRead, sendMessage } = useRealtimeMessages()
  const { isUserOnline, getUserLastSeen } = usePresence()
  const [messageText, setMessageText] = useState("")

  // Find the conversation with this user
  const conversation = conversations.find((conv) => conv.userId === userId)

  // Mark messages as read when viewing the conversation
  useEffect(() => {
    if (conversation) {
      conversation.messages.forEach((message) => {
        if (!message.is_read && message.receiver === currentUser) {
          markAsRead(message.id)
        }
      })
    }
  }, [conversation, currentUser, markAsRead])

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(userId, messageText)
      setMessageText("")
    }
  }

  const isOnline = isUserOnline(userId)
  const lastSeen = getUserLastSeen(userId)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full "></div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
            )}
          </div>
          <div className="ml-3">
            <div className="font-medium">User {userId}</div>
            <div className="text-sm ">
              {isOnline ? "Online" : lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : "Offline"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} isOwnMessage={message.sender === currentUser} />
        ))}

        {!conversation?.messages.length && (
          <div className="text-center py-8">No messages yet. Start a conversation!</div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isOwnMessage ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <div>{message.message_text}</div>
        <div className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {isOwnMessage && message.is_read && <span className="ml-2">✓</span>}
        </div>
      </div>
    </div>
  )
}
