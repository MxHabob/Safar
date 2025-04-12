"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import type { InteractionType } from "@/redux/types/types"
import { cn } from "@/lib/utils"
import { useLogInteractionMutation } from "@/redux/services/api"

export interface InteractionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  interactionType: InteractionType
  contentType: string
  objectId: string
  metadata?: Record<string, never>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children: React.ReactNode
  onInteractionLogged?: () => void
}

export const InteractionButton = ({
  interactionType,
  contentType,
  objectId,
  metadata = {},
  variant = "default",
  size = "default",
  className,
  children,
  onInteractionLogged,
  onClick,
  disabled,
  ...props
}: InteractionButtonProps) => {
  const [logInteraction, { isLoading }] = useLogInteractionMutation()

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }

    if (!disabled) {
      try {
        const deviceType = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop"
        await logInteraction({
          content_type: contentType,
          object_id: objectId,
          interaction_type: interactionType,
          metadata,
          device_type: deviceType,
        }).unwrap()

        if (onInteractionLogged) {
          onInteractionLogged()
        }
      } catch (error) {
        console.error("Failed to log interaction:", error)
      }
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </Button>
  )
}

export default InteractionButton
