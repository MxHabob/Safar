"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { closeModal } from "@/redux/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSendMessageMutation } from "@/redux/services/api"
import { toastPromise } from "@/lib/toast-promise"
import { Send, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils/date-formatter"

// Mock messages data - replace with actual API call
const mockMessages = [
  {
    id: "1",
    sender: {
      id: "user1",
      first_name: "John",
      last_name: "Doe",
    },
    receiver: {
      id: "user2",
      first_name: "Jane",
      last_name: "Smith",
    },
    message_text: "Hello, I have a question about my booking.",
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    is_read: true,
  },
  {
    id: "2",
    sender: {
      id: "user2",
      first_name: "Jane",
      last_name: "Smith",
    },
    receiver: {
      id: "user1",
      first_name: "John",
      last_name: "Doe",
    },
    message_text: "Hi John, how can I help you?",
    created_at: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
    is_read: true,
  },
  {
    id: "3",
    sender: {
      id: "user1",
      first_name: "John",
      last_name: "Doe",
    },
    receiver: {
      id: "user2",
      first_name: "Jane",
      last_name: "Smith",
    },
    message_text: "I'd like to change the dates of my reservation. Is that possible?",
    created_at: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
    is_read: true,
  },
]

export default function ChatModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [sendMessage] = useSendMessageMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isModalOpen = isOpen && type === "ChatModel"
  const booking = data.Booking
  const currentUser = { id: "user1", first_name: "John", last_name: "Doe" } // Replace with actual user

  useEffect(() => {
    if (isModalOpen) {
      scrollToBottom()
    }
  }, [messages, isModalOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const onClose = () => {
    dispatch(closeModal())
    setNewMessage("")
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const messageData = {
      receiver: { id: "user2" }, // Replace with actual receiver
      message_text: newMessage,
      booking: booking?.id,
    }

    setIsLoading(true)

    try {
      await toastPromise(sendMessage(messageData).unwrap(), {
        loading: "Sending message...",
        success: "Message sent!",
        error: (error) => `Failed to send message: ${error.data?.message || "Unknown error"}`,
      })

      // Optimistically add message to UI
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          sender: currentUser,
          receiver: { id: "user2", first_name: "Jane", last_name: "Smith" },
          message_text: newMessage,
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ])

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      title="Chat"
      description={booking ? `Regarding booking #${booking.id}` : "Support Chat"}
      isOpen={isModalOpen}
      onClose={onClose}
      className="sm:max-w-md"
    >
      <div className="flex h-[400px] flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === currentUser.id

              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className={`h-8 w-8 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                      <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                      <AvatarFallback>
                        {isCurrentUser
                          ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`
                          : `${message.sender.first_name.charAt(0)}${message.sender.last_name.charAt(0)}`}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div
                        className={`rounded-lg p-3 ${
                          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message_text}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  )
}
