"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useFollowToggle } from "@/core/hooks/use-social";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  userId: string;
  isFollowing: boolean;
  className?: string;
};

export const FollowButton = ({
  userId,
  isFollowing,
  className = "h-10 rounded-full w-1/3 mt-8",
}: FollowButtonProps) => {
  const { toggleFollow, isLoading } = useFollowToggle(userId, isFollowing);

  return (
    <Button
      onClick={toggleFollow}
      disabled={isLoading}
      className={cn(
        "transition-all",
        className
      )}
      variant={isFollowing ? "outline" : "default"}
      aria-label={isFollowing ? "Unfollow user" : "Follow user"}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Spinner className="mr-2" />
      ) : null}
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};