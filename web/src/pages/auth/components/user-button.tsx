"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const UserButton = () => {
  const router = useRouter();
  const [isSignOut, setIsSignOut] = useState<boolean>(false);
  const { user, logout } = useAuth();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 hover:opacity-80 transition-opacity cursor-pointer">
          <AvatarImage
            src={user?.avatar || "#"}
            alt="Avatar"
            className="object-cover"
          />
          <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <button
            className="w-full"
            onClick={async () => {
              setIsSignOut(true);
              await logout();
              router.push("/");
            }}
            disabled={isSignOut}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
