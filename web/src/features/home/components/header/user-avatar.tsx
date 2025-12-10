"use client";

import { UserAvatarMenu } from "./user-avatar-menu";
import { GetCurrentUserInfoApiV1UsersMeGetResponse } from "@/generated/schemas";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  user: GetCurrentUserInfoApiV1UsersMeGetResponse;
}

/**
 * User Avatar Component (Client Component)
 * Wrapper for user avatar menu
 * Follows Next.js 16.0.7 best practices:
 * - Client Component for interactivity
 * - Receives data from Server Component
 */
export function UserAvatar({ className, user }: UserAvatarProps) {
  return (
    <div className={cn("", className)}>
      <UserAvatarMenu user={user} />
    </div>
  );
}
