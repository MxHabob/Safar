"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, CreditCard, User, Receipt } from "lucide-react";
import { useGetPaymentApiV1AdminPaymentsPaymentIdGet } from "@/generated/hooks/admin";
import type { GetPaymentApiV1AdminPaymentsPaymentIdGetResponse } from "@/generated/schemas";

interface PaymentDetailPageProps {
  initialPaymentData?: GetPaymentApiV1AdminPaymentsPaymentIdGetResponse;
}

// Date formatting utility
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
    refunded: "outline",
    cancelled: "destructive",
    initiated: "secondary",
    authorized: "default",
    captured: "default",
    processing: "secondary",
    partially_refunded: "outline",
  };

  const variant = variantMap[status] || "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

// Payment method badge
function PaymentMethodBadge({ method }: { method: string }) {
  return (
    <Badge variant="outline" className="font-mono text-xs">
      {method.replace("_", " ").toUpperCase()}
    </Badge>
  );
}

export function PaymentDetailPage({ initialPaymentData }: PaymentDetailPageProps) {
  const router = useRouter();
  
  const paymentId = initialPaymentData?.id || "";

  const { data, isLoading, error, refetch } = useGetPaymentApiV1AdminPaymentsPaymentIdGet(paymentId, {
    enabled: !!paymentId,
    initialData: initialPaymentData,
  });

  const payment = data || initialPaymentData;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Payment</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load payment details"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => router.push("/payments")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
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
              {Array.from({ length: 8 }).map((_, i) => (
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

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Payment Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The payment you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
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
            onClick={() => router.push("/payments")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Payment #{payment.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(payment.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Payment ID</div>
              <div className="font-mono text-sm font-medium">{payment.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">
                <StatusBadge status={payment.status} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-medium text-lg">
                ${payment.amount?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment Method</div>
              <div className="mt-1">
                <PaymentMethodBadge method={payment.method} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created At</div>
              <div className="font-medium">{formatDate(payment.created_at)}</div>
            </div>
            {payment.completed_at && (
              <div>
                <div className="text-sm text-muted-foreground">Completed At</div>
                <div className="font-medium">{formatDate(payment.completed_at)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Booking ID</div>
              <div className="font-mono text-sm font-medium">{payment.booking_id}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

