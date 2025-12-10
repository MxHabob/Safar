"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useGetUserApiV1AdminUsersUserIdGet } from "@/generated/hooks/admin";
import type { GetUserApiV1AdminUsersUserIdGetResponse } from "@/generated/schemas";

interface UserDetailPageProps {
  userId: string;
  initialUserData?: GetUserApiV1AdminUsersUserIdGetResponse;
}

export function UserDetailPage({ userId, initialUserData }: UserDetailPageProps) {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useGetUserApiV1AdminUsersUserIdGet(userId, {
    enabled: !!userId,
    initialData: initialUserData,
    // refetchOnWindowFocus: false,
  });

  const user = data?.data;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading User</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || "Failed to load user details"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => router.push("/ai/admin/users")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The user you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/ai/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/ai/admin/users")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">User #{user.id}</h1>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Full name</div>
              <div className="font-medium">{(user.full_name as unknown as string) || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium">{user.role}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{user.status}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Company</div>
              <div className="font-medium">{(user.company as unknown as string) || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Joined</div>
              <div className="font-medium">
                {new Date(user.created_at || "").toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

