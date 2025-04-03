import type React from "react"
import { cn } from "@/lib/utils"

interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  noPadding?: boolean
  variant?: "default" | "glass" | "elevated" | "outline"
}

export function CardContainer({
  children,
  className,
  noPadding = false,
  variant = "default",
  ...props
}: CardContainerProps) {
  const variantClasses = {
    default: "bg-white border border-slate-200 shadow-soft",
    glass: "bg-white/80 backdrop-blur-md border border-white/20 shadow-medium",
    elevated: "bg-white border-none shadow-strong",
    outline: "bg-white border border-slate-200 shadow-none",
  }

  return (
    <div
      className={cn("rounded-2xl transition-all duration-200", !noPadding && "p-5", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}

