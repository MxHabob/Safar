"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRedeemPointsApiV1LoyaltyRedeemPostMutation } from "@/generated/hooks/loyalty";
import { useGetLoyaltyStatusApiV1LoyaltyStatusGet } from "@/generated/hooks/loyalty";
import { toast } from "sonner";
import { Gift, Coins } from "lucide-react";
import { useModal } from "@/lib/stores/modal-store";

const redeemSchema = z.object({
  points: z
    .number()
    .min(100, "الحد الأدنى للاستبدال هو 100 نقطة")
    .max(100000, "الحد الأقصى للاستبدال هو 100,000 نقطة")
    .refine((val) => val % 100 === 0, {
      message: "يجب أن يكون عدد النقاط مضاعفاً لـ 100",
    }),
  booking_id: z.string().optional(),
});

type RedeemFormValues = z.infer<typeof redeemSchema>;

interface RedeemPointsDialogProps {
  bookingId?: string;
  trigger?: React.ReactNode;
}

export function RedeemPointsDialog({ bookingId, trigger }: RedeemPointsDialogProps) {
  const { isOpen, type, data, onOpen, onClose } = useModal();
  const isDialogOpen = isOpen && type === "redeemPoints";
  const currentBookingId = isDialogOpen
    ? ((data?.bookingId as string | undefined) ?? bookingId)
    : bookingId;
  const { data: status } = useGetLoyaltyStatusApiV1LoyaltyStatusGet();
  const redeemMutation = useRedeemPointsApiV1LoyaltyRedeemPostMutation({
    onSuccess: (data) => {
      toast.success(
        `تم استبدال ${data.points_redeemed.toLocaleString()} نقطة بنجاح! خصم بقيمة $${data.discount_amount.toFixed(2)}`
      );
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "فشل استبدال النقاط");
    },
  });

  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      points: 100,
      booking_id: bookingId,
    },
  });

  const watchedPoints = form.watch("points");
  const discountAmount = watchedPoints ? watchedPoints / 100 : 0; // 100 points = $1

  const onSubmit = (values: RedeemFormValues) => {
    if (!status || values.points > status.balance) {
      toast.error("رصيد النقاط غير كافٍ");
      return;
    }

    redeemMutation.mutate({
      points: values.points,
      booking_id: values.booking_id || undefined,
    });
  };

  const quickSelectPoints = [100, 500, 1000, 2500, 5000];

  useEffect(() => {
    if (isDialogOpen && currentBookingId) {
      form.setValue("booking_id", currentBookingId);
    }
  }, [currentBookingId, form, isDialogOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen("redeemPoints", { bookingId: currentBookingId });
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Gift className="h-4 w-4 mr-2" />
            استبدال النقاط
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            استبدال النقاط
          </DialogTitle>
          <DialogDescription>
            استبدل نقاطك للحصول على خصم. كل 100 نقطة = $1 خصم
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Balance */}
            {status && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">رصيدك الحالي</span>
                  <span className="text-lg font-bold">{status.balance.toLocaleString()} نقطة</span>
                </div>
              </div>
            )}

            {/* Points Input */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عدد النقاط للاستبدال</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={100}
                      max={status?.balance || 100000}
                      step={100}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    الحد الأدنى: 100 نقطة | يجب أن يكون مضاعفاً لـ 100
                  </p>
                </FormItem>
              )}
            />

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickSelectPoints.map((points) => (
                <Button
                  key={points}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (status && points <= status.balance) {
                      form.setValue("points", points);
                    } else {
                      toast.error("رصيد النقاط غير كافٍ");
                    }
                  }}
                  disabled={!status || points > status.balance}
                >
                  {points.toLocaleString()}
                </Button>
              ))}
            </div>

            {/* Discount Preview */}
            {watchedPoints >= 100 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">قيمة الخصم</span>
                  <span className="text-2xl font-bold text-primary">
                    ${discountAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  سيتم خصم {watchedPoints.toLocaleString()} نقطة من رصيدك
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={redeemMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={
                  redeemMutation.isPending ||
                  !status ||
                  watchedPoints > status.balance ||
                  watchedPoints < 100
                }
              >
                {redeemMutation.isPending ? "جاري المعالجة..." : "تأكيد الاستبدال"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

