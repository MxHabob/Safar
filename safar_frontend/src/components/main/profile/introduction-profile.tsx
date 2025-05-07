"use client"
import { UserAvatar } from "@/components/global/profile/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserByIdQuery } from "@/core/services/api";
import Image from "next/image";

type IntroductionProfileProps = {
    userId: string;
}

export const IntroductionProfile = ({ userId }: IntroductionProfileProps) => {
    const {data:user,isLoading} = useGetUserByIdQuery(userId);
    console.log("user : ", user) 

    if (isLoading) {
        return <IntroductionProfile.Skeleton />;
    }

    return ( 
    <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="w-full md:w-1/2 space-y-8">
          <UserAvatar src={user?.profile?.avatar || ""} size={"lg"} count={user?.points || 0} membership={user?.membership_level || "bronze"} fallback={user?.first_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"} alt={user?.username}/>

          <div className="space-y-6">
            <h2 className="h-6 rounded-full w-3/4">
            {user?.profile?.country?.name} {user?.profile?.city?.name} {user?.profile?.region?.name}
            </h2>
            <h1 className="h-10 rounded-full w-full">
            {user?.first_name} {user?.last_name} 
            </h1>

            <Button className="h-10 rounded-full w-1/3 mt-8">
              {user?.is_following ? "Unfollow" : "Follow"}
            </Button>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <Image
            src="/images/tropical-island.png"
            width={500}
            height={500}
            alt="Tropical island with palm tree"
            priority
          />
      </div>
    </div>

     );
}
IntroductionProfile.Skeleton = function IntroductionProfileSkeleton() {
    return (
    <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <Skeleton className="w-24 h-24 rounded-full border" />
        <div className="w-full md:w-1/2 space-y-8">
            <Skeleton className="h-6 rounded-full w-3/4" />
            <Skeleton className="h-10 rounded-full w-full" />
            <Skeleton className="h-10 rounded-full w-1/3 mt-8" />
        </div>
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <Skeleton className="w-24 h-24 rounded-full border " />
        </div>
    </div>
    )
}