"use client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useFollowUserMutation, useUnfollowUserMutation } from "@/core/services/api"
import { useState } from "react"
import { toast } from "sonner"

type FollowButtonProps = {
  userId: string
  isFollowing: boolean
  onFollowChange?: (newState: boolean) => void
  className?: string
}

export const FollowButton = ({ 
  userId, 
  isFollowing, 
  onFollowChange,
  className = "h-10 rounded-full w-1/3 mt-8"
}: FollowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [followUser] = useFollowUserMutation()
  const [unfollowUser] = useUnfollowUserMutation()

  const handleFollow = async () => {
    setIsLoading(true)
    
    const action = isFollowing ? unfollowUser(userId) : followUser(userId)
    const actionName = isFollowing ? "Unfollowing" : "Following"
    const successMessage = isFollowing ? "Unfollowed successfully" : "You're now following this user"
    
    try {
      toast.promise(action, {
        loading: `${actionName} user...`,
        success: () => {
          onFollowChange?.(!isFollowing)
          return successMessage
        },
        error: (error) => {
          console.error("Follow error:", error)
          return error.data?.message || "Failed to update follow status"
        },
        finally: () => {
          setIsLoading(false)
        }
      })
    } catch {
      // Fallback error handling
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      className={className}
      variant={isFollowing ? "outline" : "default"}
    >
      {isLoading ? (
        <Spinner className="h-4 w-4 animate-spin" />
      ) : (
        isFollowing ? "Unfollow" : "Follow"
      )}
    </Button>
  )
}