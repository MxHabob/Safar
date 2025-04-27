/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { closeModal } from "@/core/features/ui/modal-slice"
import { Modal } from "@/components/global/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Linkedin, Mail, Copy, Check, PhoneIcon as WhatsApp, MessageCircle } from 'lucide-react'
import { toast } from "sonner"

export default function ShareModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  const [copied, setCopied] = useState(false)
  
  const isModalOpen = isOpen && type === "ShareModal"
  const title = data.Experience?.title || "Experience"
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  
  const onClose = () => {
    dispatch(closeModal())
    setCopied(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard! 📋")
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      toast.error("Failed to copy the link.")
    }
  }
  

  const shareOptions = [
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      color: "bg-[#1877F2] hover:bg-[#0E65D9]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      color: "bg-[#1DA1F2] hover:bg-[#0C85D0]",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      color: "bg-[#0A66C2] hover:bg-[#084E96]",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "WhatsApp",
      icon: <WhatsApp className="h-5 w-5" />,
      color: "bg-[#25D366] hover:bg-[#1DA851]",
      url: `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`
    },
    {
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      color: "bg-gray-600 hover:bg-gray-700",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`
    },
    {
      name: "Message",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-gray-500 hover:bg-gray-600",
      url: `sms:?body=${encodeURIComponent(title + " " + shareUrl)}`
    }
  ]

  const handleShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Modal
      title="Share this experience"
      description="Share this amazing experience with your friends and family"
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <div className="flex flex-col space-y-4 py-4">
        <div className="flex items-center space-x-2 rounded-md border p-2">
          <Input 
            value={shareUrl} 
            readOnly 
            className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyToClipboard} 
            className="h-8 w-8 p-0"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className={`flex flex-col items-center justify-center p-3 text-white ${option.color}`}
              onClick={() => handleShare(option.url)}
            >
              {option.icon}
              <span className="mt-1 text-xs">{option.name}</span>
            </Button>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          By sharing, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </Modal>
  )
}
