"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionButton } from "@/components/ui/action-button";
import { useGetCurrentUserInfoApiV1UsersMeGet, useUpdateCurrentUserApiV1UsersMePutMutation } from "@/generated/hooks/users";
import { GetCurrentUserInfoApiV1UsersMeGetResponse } from "@/generated/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Save } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSectionProps {
  initialUser?: GetCurrentUserInfoApiV1UsersMeGetResponse;
}

export function ProfileSection({ initialUser }: ProfileSectionProps) {
  const { data: user } = useGetCurrentUserInfoApiV1UsersMeGet({
    initialData: initialUser,
  });

  const updateMutation = useUpdateCurrentUserApiV1UsersMePutMutation({
    showToast: true,
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
    values: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateMutation.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const userInitials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatar_url || ""} alt={user?.first_name || "User"} />
          <AvatarFallback className="text-lg font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold">
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.email || "User"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Role: <span className="font-medium capitalize">{user?.role || "user"}</span>
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              First Name
            </Label>
            <Input
              id="first_name"
              {...register("first_name")}
              className="rounded-xl h-9"
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Last Name
            </Label>
            <Input
              id="last_name"
              {...register("last_name")}
              className="rounded-xl h-9"
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="rounded-xl h-9"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
          {user?.is_email_verified ? (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
              Email verified
            </p>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Email not verified
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <ActionButton
          type="submit"
          loading={updateMutation.isPending}
          disabled={!isDirty}
          icon={Save}
          loadingText="Saving..."
          className="rounded-xl h-9 px-4"
        >
          Save Changes
        </ActionButton>
      </div>
    </form>
  );
}

