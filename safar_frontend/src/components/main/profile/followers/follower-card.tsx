"use client"

import { cn } from "@/lib/utils"
import { FollowButton } from "../follow-button"
import { User } from "@/core/types"
import { UserAvatar } from "@/components/global/profile/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface FllowerCardProps {
  follower : User
  className?: string
}

export const FllowerCard = ({follower,className}: FllowerCardProps) => {

  return (
    <div className={cn("flex flex-col items-center p-4 max-w-xs mx-auto rounded-lg bg-card",className)}>
      <div className={cn("relative mb-1")}>
        <UserAvatar id={follower?.id || ""} src={follower.profile?.avatar || ""} size={"lg"} count={follower?.points || 0} membership={follower?.membership_level || "bronze"} fallback={follower?.first_name?.charAt(0).toUpperCase() || follower?.username?.charAt(0).toUpperCase() || "U"} alt={follower?.username}/>
      </div>
      <h3 className="text-lg font-medium mt-2">{follower.first_name} {follower.last_name}</h3>
      <p className="text-sm text-gray-600 mb-3">.</p>
       <FollowButton className={cn("py-2 px-6 rounded-full text-sm font-medium transition-colors w-full text-center")} userId={follower.id} isFollowing={follower?.is_following || false}/>
    </div>
  )
}

FllowerCard.Skeleton = function FllowerCardSkeleton() {
    return (
      <div className={cn( "flex flex-col items-center p-4 max-w-xs mx-auto rounded-lg")}>
        <div className={cn("relative mb-1")}>
          <div className={cn("w-32 h-32 rounded-full border-2 flex items-center justify-center")}>
            <Skeleton className="w-full h-full rounded-full bg-gray-200"/>
          </div>
          <Skeleton className="absolute bottom-0 right-0 w-16 h-5 rounded-full bg-gray-200"/>
        </div>
        <Skeleton className="h-6 w-24 bg-gray-200 rounded mt-2"/>
        <Skeleton className="h-4 w-32 bg-gray-200 rounded mt-2 mb-3"/>
        <Skeleton className="h-10 w-full bg-gray-200 rounded-full"/>
      </div>
    )
}