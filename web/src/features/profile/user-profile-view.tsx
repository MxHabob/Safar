"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserInfoApiV1UsersMeGet } from "@/generated/actions/users";
import { formatDate } from "@/lib/utils/date";

interface UserProfileViewProps {
  userId: string;
}

/**
 * User profile view
 * Shows public user profile information
 */
export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  // Note: Currently using current user API as there's no getUserById endpoint
  // In production, this should use a proper getUserById API
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      // For now, use current user API
      // TODO: Replace with getUserById API when available
      const result = await getCurrentUserInfoApiV1UsersMeGet();
      // Handle SafeActionResult type
      if (result && typeof result === 'object' && 'data' in result) {
        return result.data;
      }
      return result as any;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <UserProfileLoading />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
          <Card className="rounded-[18px] border border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Failed to load user profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fullName = user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}` || "U";
  const location = user.city && user.country 
    ? `${user.city}, ${user.country}` 
    : user.city || user.country || "Not specified";

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <Card className="rounded-[18px] border border-border">
          <div className="absolute top-0 left-0 size-[18px]">
            <Graphic />
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="size-24 rounded-[18px]">
                <AvatarImage src={user.avatar_url || user.avatar} alt={fullName} />
                <AvatarFallback className="rounded-[18px] text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-2xl font-light">{fullName}</h1>
                {user.username && (
                  <p className="text-muted-foreground font-light">@{user.username}</p>
                )}
              </div>
            </div>
            
            {user.bio && (
              <p className="text-muted-foreground font-light leading-relaxed pt-4 border-t border-border">
                {user.bio}
              </p>
            )}
            
            <div className="space-y-4 pt-6 border-t border-border">
              {user.created_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground font-light">Member since</div>
                    <div className="font-light">{formatDate(user.created_at, "MMM yyyy")}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Location</div>
                  <div className="font-light">{location}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const UserProfileLoading = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Skeleton className="h-96 rounded-[18px]" />
      </div>
    </div>
  );
};

