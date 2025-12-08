"use client";

import { Calendar, CreditCard, XCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// Simple date formatting utility
const format = (date: Date | string, formatStr: string) => {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  if (formatStr === "PPP") {
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return d.toLocaleDateString();
};
import { cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost } from "@/generated/actions/subscriptions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CurrentSubscriptionProps {
  subscription?: any;
}

export function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const router = useRouter();

  const { execute: cancelSubscription, isExecuting } = useAction(
    cancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPost,
    {
      onSuccess: () => {
        toast.success("Subscription cancelled successfully");
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.message || "Failed to cancel subscription");
      },
    }
  );

  const handleCancel = () => {
    if (subscription?.id) {
      cancelSubscription({
        path: {
          subscription_id: subscription.id,
        },
      });
    }
  };

  if (!subscription) {
    return (
      <Card className="rounded-[18px] border">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground font-light">No active subscription</p>
          <p className="text-sm text-muted-foreground mt-2">
            Subscribe to a plan to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const isActive = subscription.status === "active";
  const isCancelled = subscription.status === "cancelled";

  return (
    <Card className="rounded-[18px] border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-light">{subscription.plan_name || "Subscription"}</CardTitle>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="rounded-[18px]"
          >
            {subscription.status || "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>Start Date</span>
            </div>
            <p className="font-light">
              {subscription.start_date
                ? format(new Date(subscription.start_date), "PPP")
                : "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>End Date</span>
            </div>
            <p className="font-light">
              {subscription.end_date
                ? format(new Date(subscription.end_date), "PPP")
                : "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              <span>Price</span>
            </div>
            <p className="font-light">
              {subscription.price} {subscription.currency || ""} / {subscription.billing_period || "month"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" />
              <span>Auto-renewal</span>
            </div>
            <p className="font-light">
              {subscription.auto_renew ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        {subscription.features && subscription.features.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium">Features</h3>
            <ul className="space-y-2">
              {subscription.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-primary" />
                  <span className="font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isActive && !isCancelled && (
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-[18px]">
                  <XCircle className="size-4" />
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[18px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You will lose access to
                    premium features at the end of your billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-[18px]">Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={isExecuting}
                    className="rounded-[18px] bg-destructive"
                  >
                    {isExecuting ? "Cancelling..." : "Cancel Subscription"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CurrentSubscriptionLoading() {
  return (
    <Card className="rounded-[18px] border">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-48 rounded-[18px]" />
      </CardContent>
    </Card>
  );
}

