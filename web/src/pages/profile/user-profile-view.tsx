"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin } from "lucide-react";
import Graphic from "@/components/shared/graphic";

interface UserProfileViewProps {
  userId: string;
}

/**
 * User profile view
 * Shows public user profile information
 */
export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  // TODO: Fetch user data using React Query hook

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <Card className="rounded-[18px] border border-border">
          <div className="absolute top-0 left-0 size-[18px]">
            <Graphic />
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-6">
              <Skeleton className="size-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Member since</div>
                  <div className="font-light">Loading...</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground font-light">Location</div>
                  <div className="font-light">Loading...</div>
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

