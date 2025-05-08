'use client'


import { useGetUserByIdQuery } from "@/core/services/api";
import { useState } from "react";
import { UserAvatar } from '@/components/global/profile/user-avatar';
import { RouterBack } from '@/components/global/router-back';
import { Button } from "@/components/ui/button";
import { FollowButton } from './follow-button';
import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from '@/components/ui/card';
import { StatusCircle } from '@/components/dashboard/ui/status-circle';
import { ListFollowers } from "./followers/followers-list";

type MoreProfileProps = {
    userId: string;
}
export const MoreProfile = ({ userId }: MoreProfileProps) => {
    const { data: user, isLoading } = useGetUserByIdQuery(userId);

    if (isLoading) {
        return <MoreProfile.Skeleton />;
    }
    console.log('following_count:', user?.following_count)
    return (
  <div className="container max-w-6xl mx-auto">
      <RouterBack />
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2 space-y-18">
              <UserAvatar src={user?.profile?.avatar || ""} size={"lg"} count={user?.points || 0} membership={user?.membership_level || "bronze"} fallback={user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"} alt={user?.username} />
              <div className="space-y-8">
                  <p className="text-lg text-gray-500 font-semibold">
                      {user?.profile?.country?.name} {user?.profile?.city?.name} {user?.profile?.region?.name}
                  </p>
                  <p className="text-3xl md:text-5xl font-bold">
                      {user?.first_name} {user?.last_name}
                  </p>
              </div>
              <div className='text-lg flex justify-center ' >{user?.profile?.gender}</div>
              <div className="flex items-center gap-4">
                 <FollowButton userId={userId} isFollowing={user?.is_following || false}/>
                  <Button variant={"outline"} className="h-10 rounded-full w-1/3 mt-8">
                      Message
                  </Button>
              </div>
          <ListFollowers userId={userId} />
          </div>
          <div className='flex justify-end'>
              <CardContent className="p-4 pt-0 flex flex-col items-end">
                  <div className="text-xl font-bold mb-2">{user?.membership_level || "curve"}</div>
                  <StatusCircle value={user?.points || 0} maxValue={10000} />
                  <div className="mt-2 text-xs text-muted-foreground">{10000 - (user?.points || 0)} points until Diamond status</div>
              </CardContent>
          </div>
      </div>
  </div>
  )
}
MoreProfile.Skeleton = function MoreProfileSkeleton() {
    return (
        <div className="container max-w-6xl mx-auto">
            <RouterBack />
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="w-full md:w-1/2 space-y-16">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-6">
                        <div className="space-y-8">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-8 w-1/2" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-1/3" />
                            <Skeleton className="h-10 w-1/3" />
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                    <Skeleton className="h-[500px] w-[500px]" />
                </div>
            </div>
        </div>
    )
}