"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import Link from "next/link"

const UserAvatarWrapperVariants = cva("relative inline-block", {
  variants: {
    size: {
      xs: "w-7 h-7",
      sm: "w-10 h-10",
      md: "w-16 h-16",
      lg: "w-24 h-24",
      xl: "w-32 h-32",
    },
    membership: {
      bronze: "ring-2 ring-gray-400 rounded-full",
      gold: "ring-2 ring-blue-500 rounded-full",
      silver: "ring-2 ring-purple-600 rounded-full",
      platinum: "ring-2 ring-amber-500 rounded-full",
    },
  },
  defaultVariants: {
    size: "md",
    membership: "bronze",
  },
})

const badgeVariants = cva(
  "absolute bottom-[-2] right-[-2] rounded-full bg-black text-white font-bold flex items-center justify-center",
  {
    variants: {
      size: {
        xs: "w-4 h-4 text-[8px]",
        sm: "w-5 h-5 text-[10px]",
        md: "w-8 h-8 text-xs",
        lg: "w-10 h-10 text-sm",
        xl: "w-12 h-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface UserAvatarProps extends VariantProps<typeof UserAvatarWrapperVariants> {
  count: number
  src?: string
  alt?: string
  id?: string
  fallback: string
  className?: string
}

export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}M`
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}K`
  } else {
    return count.toString()
  }
}

export const UserAvatar =({
  count,
  src,
  id,
  alt = "Avatar",
  fallback,
  size,
  membership,
  className,
}: UserAvatarProps) => {
  const formattedCount = formatCount(count)
  
  return (
   <div className={cn(UserAvatarWrapperVariants({ size, membership }), className)}>
    <Link href={id ? `/profile/${id}` : "#"}>
      <Avatar className="h-full w-full">
        <AvatarImage src={src || ""} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    </Link>
      <div className={badgeVariants({ size })}>{formattedCount}</div>
   </div>
  )
}
