"use client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useFollowUserMutation, useUnfollowUserMutation } from "@/core/services/api"
import { toast } from "sonner"

type FollowButtonProps = {
  userId: string
  isFollowing: boolean
  className?: string
}

export const FollowButton = ({ 
  userId, 
  isFollowing, 
  className = "h-10 rounded-full w-1/3 mt-8"
}: FollowButtonProps) => {
  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation()
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation()

  const isLoading = isFollowingLoading || isUnfollowingLoading

  const handleFollow = async () => {
    const action = isFollowing ? unfollowUser(userId) : followUser(userId)
    const actionName = isFollowing ? "Unfollowing" : "Following"
    const successMessage = isFollowing ? "Unfollowed successfully" : "You're now following this user"
    
    toast.promise(action, {
      loading: `${actionName} user...`,
      success: successMessage,
      error: (error) => {
        console.error("Follow error:", error)
        return error.data?.message || "Failed to update follow status"
      }
    })
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      className={className}
      variant={isFollowing ? "outline" : "default"}
    >
      {isLoading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        isFollowing ? "Unfollow" : "Follow"
      )}
    </Button>
  )
}