"use client";

import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { useGetUserByIdQuery } from "@/core/services/api";
import { ListFollowers } from "./followers/followers-list";
import { UserAvatar } from "@/components/global/profile/user-avatar";
import { FollowButton } from "./follow-button";
import { StatusCircle } from "@/components/dashboard/status-circle";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileProps = {
  userId: string;
};

export const ProfileDetailsPage = ({ userId }: ProfileProps) => {
  const { data: user, isLoading, error } = useGetUserByIdQuery(userId);
  if (isLoading) return <ProfileDetailsPage.Skeleton />;
  if (error) return <div className="p-6 text-center">Failed to load user profile</div>;
  
  return (
    <div className="w-full h-full">
      <div className=" mx-auto max-w-5xl py-6">
          {/* <RouterBack/> */}
        <div className="rounded-lg p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <UserAvatar 
              src={user?.profile?.avatar || ""} 
              size={"xl"} 
              count={user?.points || 0} 
              membership={user?.membership_level || "bronze"} 
              fallback={user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"} 
              alt={user?.username}
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h1>
                  <p className="text-zinc-400 text-xs">{user?.profile?.country?.name} {user?.profile?.city?.name} {user?.profile?.region?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <FollowButton 
                    userId={userId} 
                    isFollowing={user?.is_following || false}
                    className="rounded-lg"
                  />
                  <Button variant="outline" className="rounded-lg">
                    Message
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-lg">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{user?.followers_count || 0}</span> followers
                </div>
                <div>
                  <span className="font-semibold">{user?.following_count || 0}</span> following
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{user?.profile?.gender || ""}</span>
                </div>
                <div>
                  <span className="font-semibold">{user?.language || ""}</span>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold">{user?.username}</p>
                <p className="text-zinc-400">{user?.profile?.bio}</p>
                <div className="flex items-center gap-1">
                  <span>🔗</span>
                  <a href={`https://safar-sable.vercel.app/profile/${user?.id}`} className="text-blue-400">
                    https://safar-sable.vercel.app/profile/{user?.username}
                  </a>
                  <span>•</span>
                  <span>4</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <StatusCircle value={user?.points || 0} maxValue={10000} />
            </div>
          </div>
        </div>

        <div className="mx-32 my-6">
          <ListFollowers userId={userId} />
        </div>
        <div className="mt-4 flex justify-end md:hidden">
          <StatusCircle value={user?.points || 0} maxValue={10000} />
        </div>
      </div>
    </div>
  );
};

ProfileDetailsPage.Skeleton = function ProfileDetailsPageSkeleton() {
  return (
    <div className="w-full h-full">
      <div className="container mx-auto max-w-3xl py-6">
        <div className="rounded-lg p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>

              <Skeleton className="h-5 w-48" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <Skeleton className="h-5 w-64" />
            </div>

            <div className="hidden md:block">
              <Skeleton className="h-20 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end md:hidden">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};