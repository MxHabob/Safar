"use client"

import type { InteractionType } from "@/core/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { forwardRef } from "react"
import { useLogInteractionMutation } from "@/core/services/api"

export interface InteractionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  interactionType: InteractionType
  contentType: string
  objectId: string
  href: string
  metadata?: Record<string, never>
  className?: string
  children: React.ReactNode
  onInteractionLogged?: () => void
  external?: boolean
  target?: string
  rel?: string
}

export const InteractionLink = forwardRef<HTMLAnchorElement, InteractionLinkProps>(
  (
    {
      interactionType,
      contentType,
      objectId,
      href,
      metadata = {},
      className,
      children,
      onInteractionLogged,
      onClick,
      external = false,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const [logInteraction] = useLogInteractionMutation()

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick handler if provided
      if (onClick) {
        onClick(e)
      }

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

    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          className={cn(className)}
          onClick={handleClick}
          target={target || "_blank"}
          rel={rel || "noopener noreferrer"}
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className={cn(className)}
        onClick={handleClick}
        ref={ref}
        target={target}
        rel={rel}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

InteractionLink.displayName = "InteractionLink"

export default InteractionLink
