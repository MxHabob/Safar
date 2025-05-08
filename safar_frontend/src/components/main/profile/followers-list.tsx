'use client'
import { UserAvatar } from '@/components/global/profile/user-avatar';
import { useGetUserFollowingQuery } from '@/core/services/api';

import React, { useState } from 'react';
import { FollowButton } from './follow-button';
import { User } from '@/core/types';

type listProps ={
    user: User | undefined;
    userId: string;

}
const handleFollow = ()=>{
    
}

const FollowersList = ({ user , userId }: listProps) => {
    const [isFollowing, setIsFollowing] = useState(user?.is_following || false);
    const { data: followers, isLoading: isLoadingFollowers } = useGetUserFollowingQuery(userId);
    const [isLoading, setIsLoading] = useState(false)


    if (isLoadingFollowers ) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {followers && followers.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold">Followers ({followers.length})</h3>
                    <div className="flex items-center gap-2">
                        {followers.slice(0, 5).map((follower) => (
                            <div key={follower.id}>
                            <UserAvatar
                                size="sm"
                                count={follower.points || 0}
                                className="follower-avatar"
                                src={follower.profile?.avatar || ""}
                                fallback={
                                    follower.first_name?.charAt(0).toUpperCase() ||
                                    follower.username?.charAt(0).toUpperCase() ||
                                    "U"
                                }
                                alt={`Follower ${follower.username}`}
                            />
                            <div>{follower.username}</div>
                             <FollowButton 
                                         userId={follower.id} 
                                         isFollowing={isFollowing}
                                         onFollowChange={setIsFollowing}
                                        />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FollowersList;