"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/redux/hooks/useAuth';
import { Calendar, LogOut, Settings, User2 } from 'lucide-react';

interface UserAvatarProps {
  className?: string;
  showName?: boolean;
  showDropdown?: boolean;
}

export function UserAvatar({ className, showName = false, showDropdown = true }: UserAvatarProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        {showName && <Skeleton className="h-4 w-20" />}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/login')}
        className={className}
      >
        Sign in
      </Button>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {

    }
  };

  const avatarContent = (
    <Avatar className={className}>
      <AvatarImage 
        src={user.profile?.avatar} 
        alt={user.first_name || 'User avatar'}
      />
      <AvatarFallback>
        {user.first_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() }
      </AvatarFallback>
    </Avatar>
  );

  if (!showDropdown) {
    return (
      <div className="flex items-center gap-2">
        {avatarContent}
        {showName && (
          <span className="font-medium">
            {user.first_name || user.email.split('@')[0]}
          </span>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative h-8 w-8 rounded-full p-0">
          {avatarContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.first_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('#')}>
          <User2 className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('#')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('#')}>
          <Calendar className="mr-2 h-4 w-4" />
          My Bookings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}