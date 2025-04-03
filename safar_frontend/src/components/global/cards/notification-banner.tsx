import type React from "react"
import { cn } from "@/lib/utils"
import { CardContainer } from "@/components/ui/card-container"

interface NotificationBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  message: string
  variant?: "default" | "success" | "warning" | "error" | "info"
}

export function NotificationBanner({
  icon,
  message,
  variant = "default",
  className,
  ...props
}: NotificationBannerProps) {
  const variantClasses = {
    default: "bg-white text-slate-800",
    success: "bg-teal-50 text-teal-800",
    warning: "bg-amber-50 text-amber-800",
    error: "bg-brand-50 text-brand-800",
    info: "bg-blue-50 text-blue-800",
  }

  return (
    <CardContainer
      variant="elevated"
      className={cn(
        "flex items-center gap-3 py-3.5 px-5 hover:shadow-medium transition-all duration-300",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span className="text-sm font-medium">{message}</span>
    </CardContainer>
  )
}

export function RareFindBanner({ className, ...props }: Omit<NotificationBannerProps, "icon" | "message">) {
  return (
    <NotificationBanner
      icon={
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-md animate-pulse-soft">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      }
      message="Rare find! This place is usually booked"
      className={className}
      {...props}
    />
  )
}

