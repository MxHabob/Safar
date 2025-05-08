'use client';

import { useGetUserByIdQuery } from "@/core/services/api";
import { UserAvatar } from '@/components/global/profile/user-avatar';
import { RouterBack } from '@/components/global/router-back';
import { Button } from "@/components/ui/button";
import { FollowButton } from './follow-button';
import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from '@/components/ui/card';
import { StatusCircle } from '@/components/dashboard/ui/status-circle';
import { ListFollowers } from "./followers/followers-list";

type ProfileProps = {
  userId: string;
};

export const ProfilePage = ({ userId }: ProfileProps) => {
  const { data: user, isLoading, error } = useGetUserByIdQuery(userId);

  if (isLoading) {
    return <ProfilePage.Skeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-red-500">Error loading profile data</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div>User not found</div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <RouterBack />
      <div className="flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="w-full md:w-1/2 space-y-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <UserAvatar
              src={user.profile?.avatar || ""}
              size="lg"
              count={user.points || 0}
              membership={user.membership_level || "bronze"}
              fallback={
                user.first_name?.charAt(0).toUpperCase() ||
                user.username?.charAt(0).toUpperCase() ||
                "U"
              }
              alt={user.username}
            />
            
            <div className="space-y-2 text-center md:text-left">
              <p className="text-lg text-gray-500 font-semibold">
                {[user.profile?.city?.name, user.profile?.region?.name, user.profile?.country?.name]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <h1 className="text-3xl md:text-5xl font-bold">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-lg">{user.profile?.gender}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <FollowButton 
              userId={userId} 
              isFollowing={user.is_following || false}
              className="w-full md:w-auto"
            />
            <Button variant="outline" className="w-full md:w-auto">
              Message
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Followers ({user.followers_count || 0})</h2>
            <ListFollowers userId={userId} />
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="text-xl font-bold mb-2">
              {user.membership_level?.toUpperCase() || "BRONZE"} MEMBER
            </div>
            <StatusCircle 
              value={user.points || 0} 
              maxValue={10000} 
            />
            <div className="mt-4 text-sm text-muted-foreground">
              {10000 - (user.points || 0)} points until Diamond status
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

ProfilePage.Skeleton = function ProfileSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="w-full md:w-1/2 space-y-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 text-center md:text-left w-full">
              <Skeleton className="h-6 w-1/3 mx-auto md:mx-0" />
              <Skeleton className="h-10 w-1/2 mx-auto md:mx-0" />
              <Skeleton className="h-5 w-1/4 mx-auto md:mx-0" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <Skeleton className="h-10 w-full md:w-32" />
            <Skeleton className="h-10 w-full md:w-32" />
          </div>

          <div className="mt-8">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-32 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      </div>
    </div>
  );
};