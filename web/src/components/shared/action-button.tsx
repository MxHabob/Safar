"use client"

import * as React from "react"
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonProps extends ButtonProps, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function ActionButton({
  loading = false,
  loadingText,
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  )
}

