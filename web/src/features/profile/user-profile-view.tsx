"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin } from "lucide-react";
import Graphic from "@/components/shared/graphic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/client";
import { formatDate } from "@/lib/utils/date";

interface UserProfileViewProps {
  userId: string;
}

/**
 * User profile view
 * Shows public user profile information
 * 
 * NOTE: Currently only shows current user profile as there's no getUserById endpoint
 * TODO: Replace with getUserById API when available
 */
export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  // Use auth context instead of calling /api/v1/users/me
  // This prevents unnecessary API calls since user data is already in session
  const { user, isLoading } = useAuth();
  
  // For now, only show profile if it's the current user
  // TODO: When getUserById endpoint is available, fetch user by userId
  const isCurrentUser = user?.id === userId;

  if (isLoading) {
    return <UserProfileLoading />;
  }

  if (!user || !isCurrentUser) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
          <Card className="rounded-[18px] border border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {!user ? "Please log in to view profile" : "User profile not available"}
              </p>
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
                <AvatarImage src={user.avatar_url || undefined} alt={fullName} />
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

