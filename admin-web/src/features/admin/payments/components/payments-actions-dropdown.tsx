"use client";

import { 
  MoreHorizontal, 
  Eye, 
  RotateCcw,
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
import type { AdminPaymentResponse } from "@/generated/schemas";
import { useRouter } from "next/navigation";
import { useModal } from "@/lib/stores/modal-store";

interface PaymentActionsProps {
  payment: AdminPaymentResponse;
}

export function PaymentActionsDropdown({ payment }: PaymentActionsProps) {
  const router = useRouter();
  const { onOpen } = useModal();

  const handleViewDetails = () => {
    router.push(`/payments/${payment.id}`);
  };

  const handleRefundPayment = () => {
    onOpen("adminConfirmRefundPayment", {
      paymentId: payment.id,
      amount: payment.amount,
      onSuccess: () => {
        // Data will be refetched automatically by the modal
      },
    });
  };

  const canRefund = payment.status === "completed";

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
          {canRefund && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleRefundPayment}
                className="text-primary"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>Refund Payment</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

