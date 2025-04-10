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
import type { Message, User } from "@/redux/types/types"
import { useAuth } from "@/redux/hooks/usee-auth"

export default function ChatModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [sendMessage] = useSendMessageMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isModalOpen = isOpen && type === "ChatModel"
  const messages = (data.messages as Message[]) || []
  const otherUser = data.otherUser as User
  const booking = data.Booking
  const { user, isAuthenticated } = useAuth()

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
      receiver: otherUser.id,
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

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isModalOpen || !otherUser) return null

  return (
    <Modal
      title={`Chat with ${otherUser.first_name} ${otherUser.last_name}`}
      description={booking ? `Regarding booking #${booking.id}` : ""}
      isOpen={isModalOpen}
      onClose={onClose}
      className="sm:max-w-md"
    >
      <div className="flex h-[400px] flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender.id === user.id

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
              })
            )}
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
