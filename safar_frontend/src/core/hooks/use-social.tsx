"use client";
import { useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '../services/api'

export const useFollowUser = () => {
  const [followMutation, { isLoading }] = api.useFollowUserMutation()

  const followUser = useCallback(async (userId: string) => {
    const followPromise = followMutation(userId).unwrap()
    
    toast.promise(followPromise, {
      loading: 'Sending follow request...',
      success: () => {
        return 'Successfully followed user!'
      },
      error: (err) => {
        console.error('Follow error:', err)
        return err.data?.error || 'Failed to follow user'
      },
    })

    return followPromise
  }, [followMutation])

  return { followUser, isLoading }
}

export const useUnfollowUser = () => {
  const [unfollowMutation, { isLoading }] = api.useUnfollowUserMutation()

  const unfollowUser = useCallback(async (userId: string) => {
    const unfollowPromise = unfollowMutation(userId).unwrap()
    
    toast.promise(unfollowPromise, {
      loading: 'Removing follow...',
      success: () => {
        return 'Successfully unfollowed user'
      },
      error: (err) => {
        console.error('Unfollow error:', err)
        return err.data?.error || 'Failed to unfollow user'
      },
    })

    return unfollowPromise
  }, [unfollowMutation])

  return { unfollowUser, isLoading }
}

export const useFollowToggle = (userId: string, isFollowing: boolean) => {
  const { followUser, isLoading: isFollowLoading } = useFollowUser()
  const { unfollowUser, isLoading: isUnfollowLoading } = useUnfollowUser()

  const toggleFollow = useCallback(async () => {
    try {
      if (isFollowing) {
        await unfollowUser(userId)
      } else {
        await followUser(userId)
      }
    } catch (error) {
      console.error('Follow toggle error:', error)
    }
  }, [userId, isFollowing, followUser, unfollowUser])

  return { toggleFollow, isLoading: isFollowLoading || isUnfollowLoading }
}