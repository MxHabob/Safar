"use client";

import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PaymentResponse } from "@/generated/schemas";

interface PaymentStatusProps {
  payment: PaymentResponse;
}

export function PaymentStatus({ payment }: PaymentStatusProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        label: "Pending",
        variant: "secondary" as const,
        color: "text-yellow-600",
      },
      processing: {
        icon: Clock,
        label: "Processing",
        variant: "secondary" as const,
        color: "text-blue-600",
      },
      completed: {
        icon: CheckCircle,
        label: "Completed",
        variant: "default" as const,
        color: "text-green-600",
      },
      failed: {
        icon: XCircle,
        label: "Failed",
        variant: "destructive" as const,
        color: "text-red-600",
      },
      refunded: {
        icon: AlertCircle,
        label: "Refunded",
        variant: "outline" as const,
        color: "text-gray-600",
      },
    };

    return (
      configs[status as keyof typeof configs] || {
        icon: AlertCircle,
        label: status,
        variant: "secondary" as const,
        color: "text-gray-600",
      }
    );
  };

  const config = getStatusConfig(payment.status);
  const Icon = config.icon;

  return (
    <Card className="rounded-[18px] border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-light mb-1">Payment Status</h3>
            <p className="text-sm text-muted-foreground font-light">
              Payment ID: {payment.id}
            </p>
          </div>
          <Badge variant={config.variant} className="rounded-full">
            <Icon className={`size-4 mr-1 ${config.color}`} />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-light">Amount</span>
            <span className="font-light">
              {payment.currency} {payment.amount}
            </span>
          </div>
          {payment.payment_method && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-light">Method</span>
              <span className="font-light capitalize">
                {payment.payment_method.replace("_", " ")}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-light">Date</span>
            <span className="font-light">
              {new Date(payment.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

