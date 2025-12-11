"use client";

import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash, 
  ShoppingCart, 
  Mail, 
  FileText,
  Ban,
  UserCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AdminUserResponse } from "@/generated/schemas";
import { useRouter } from "next/navigation";
import { useModal } from "@/lib/stores/modal-store";

interface UserActionsProps {
  user: AdminUserResponse;
}

export function UserActionsDropdown({ user }: UserActionsProps) {
  const route = useRouter()
  const { onOpen } = useModal()
  const handleViewDetails = () => {
    route.push(`/users/${user.id}`)
  };

  const handleEditUser = () => {
    const userName = 
      (user.first_name && user.last_name)
        ? `${user.first_name} ${user.last_name}`
        : user.username || user.email || undefined;
    onOpen("adminEditUser", {
      userId: user.id,
      userEmail: user.email as unknown as string,
      userName: userName as unknown as string,
      payload: {
        email: user.email as unknown as string,
        first_name: user.first_name as unknown as string,
        last_name: user.last_name as unknown as string,
        username: user.username as unknown as string,
      },
    })
  };

  const handleViewPurchases = () => {
    // Implement view purchases functionality
    console.log("View purchases for", user.id);
  };

  const handleSendEmail = () => {
    // Implement email functionality
    console.log("Email user", user.email);
  };

  const handleCreateOrder = () => {
    // Implement new order functionality
    console.log("Create order for", user.id);
  };

  const handleViewInvoices = () => {
    // Implement view invoices functionality
    console.log("View invoices for", user.id);
  };

  const handleActivateUser = () => {
    onOpen("adminConfirmActivateUser", {
      userId: user.id,
      userEmail: user.email as unknown as string,
    })
  };

  const handleBlockUser = () => {
    onOpen("adminConfirmSuspendUser", {
      userId: user.id,
      userEmail: user.email as unknown as string,
    })
  };

  const handleDeleteUser = () => {
    onOpen("adminConfirmDeleteUser", {
      userId: user.id,
      userEmail: user.email as unknown as string,
      onSuccess: () => {
        // Data will be refetched automatically by the modal
      }
    })
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditUser}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit User</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewPurchases}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>View Purchases</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewInvoices}>
            <FileText className="mr-2 h-4 w-4" />
            <span>View Invoices</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateOrder}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Create Order</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Send Email</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {(user.status === "inactive" || user.status === "suspended") && (
            <DropdownMenuItem onClick={handleActivateUser}>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Activate User</span>
            </DropdownMenuItem>
          )}
          {user.status !== "inactive" && (
            <DropdownMenuItem onClick={handleBlockUser} className="text-amber-600">
              <Ban className="mr-2 h-4 w-4" />
              <span>Block User</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteUser}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 