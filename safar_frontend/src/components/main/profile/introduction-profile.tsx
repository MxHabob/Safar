"use client"
import { UserAvatar } from "@/components/global/profile/user-avatar";
import { RouterBack } from "@/components/global/router-back";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserByIdQuery } from "@/core/services/api";
import Image from "next/image";
import { FollowButton } from "./follow-button";
import { useState } from "react";

type IntroductionProfileProps = {
    userId: string;
}

export const IntroductionProfile = ({ userId }: IntroductionProfileProps) => {
    const {data:user,isLoading} = useGetUserByIdQuery(userId);
    const [isFollowing, setIsFollowing] = useState(user?.is_following || false);

    if (isLoading) {
        return <IntroductionProfile.Skeleton />;
    }

    return ( 
  <div className="container max-w-6xl mx-auto">
        <RouterBack/>
    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="w-full md:w-1/2 space-y-18  ml-8 mt-4">
          <UserAvatar src={user?.profile?.avatar || ""} size={"lg"} count={user?.points || 0} membership={user?.membership_level || "bronze"} fallback={user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"} alt={user?.username}/>
          <div className="space-y-6">
            <div className="space-y-8">
            <p className="text-lg text-gray-600 font-semibold">
            {user?.profile?.country?.name} {user?.profile?.city?.name} {user?.profile?.region?.name}
            </p>
            <p className="text-3xl md:text-5xl font-bold">
            {user?.first_name} {user?.last_name} 
            </p>
            </div>
            <div className="flex items-center gap-4">
            <FollowButton 
             userId={userId} 
             isFollowing={isFollowing}
             onFollowChange={setIsFollowing}
            />
            <Button variant={"outline"} className="h-10 rounded-full w-1/3 mt-8">
              Message
            </Button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <Image
            src="/images/tropical-island.png"
            width={600}
            height={600}
            alt="Tropical island with palm tree"
            priority
          />
      </div>
    </div>
  </div>

 );
}
IntroductionProfile.Skeleton = function IntroductionProfileSkeleton() {
    return (
  <div className="container max-w-6xl mx-auto">
        <RouterBack/>
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