"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Percent, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateCouponApiV1PromotionsCouponsPostMutation } from "@/generated/hooks/promotions";
import { useModal } from "@/lib/stores/modal-store";

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
import { toast } from "sonner";
import { DiscountTypeSchema } from "@/generated/schemas";

const createCouponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(50),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  discount_type: DiscountTypeSchema,
  discount_value: z.number().min(0.01, "Discount value must be greater than 0"),
  max_discount_amount: z.number().optional(),
  min_purchase_amount: z.number().min(0),
  start_date: z.date(),
  end_date: z.date(),
  max_uses: z.number().int().optional(),
  max_uses_per_user: z.number().int().min(1),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type CreateCouponFormValues = z.infer<typeof createCouponSchema>;

export function CreateCouponDialog() {
  const { isOpen, type, data, onClose } = useModal();
  const isDialogOpen = isOpen && type === "createCoupon";
  const onSuccess = data?.onSuccess as (() => void) | undefined;
  const form = useForm<CreateCouponFormValues>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discount_type: "percentage" as const,
      discount_value: 10,
      max_discount_amount: undefined,
      min_purchase_amount: 0,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      max_uses: undefined,
      max_uses_per_user: 1,
    },
  });

  const discountType = form.watch("discount_type");
  const isPercentage = discountType === "percentage";

  const createCouponMutation = useCreateCouponApiV1PromotionsCouponsPostMutation({
    onSuccess: () => {
      toast.success("Coupon created successfully!");
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create coupon: ${error.message}`);
    },
    showToast: false,
  });

  const onSubmit = async (values: CreateCouponFormValues) => {
    try {
      await createCouponMutation.mutateAsync({
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description || undefined,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount_amount: values.max_discount_amount,
        min_purchase_amount: values.min_purchase_amount,
        start_date: values.start_date.toISOString().split("T")[0],
        end_date: values.end_date.toISOString().split("T")[0],
        max_uses: values.max_uses || undefined,
        max_uses_per_user: values.max_uses_per_user || undefined,
      });
    } catch (error) {
      // Error handled by onError callback
      console.error("Create coupon error:", error);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[18px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Create New Coupon</DialogTitle>
          <DialogDescription className="font-light">
            Create a discount coupon for your listings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Coupon Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="SUMMER2025"
                        className="rounded-[18px] uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Summer Sale"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-light">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe this coupon..."
                      className="rounded-[18px]"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Discount Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-[18px]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="size-4" />
                            <span>Percentage</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed_amount">
                          <div className="flex items-center gap-2">
                            <DollarSign className="size-4" />
                            <span>Fixed Amount</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="free_nights">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4" />
                            <span>Free Nights</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">
                      Discount Value {isPercentage ? "(%)" : "($)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isPercentage && (
              <FormField
                control={form.control}
                name="max_discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Max Discount Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormDescription className="font-light">
                      Maximum discount amount for percentage discounts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="min_purchase_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-light">Minimum Purchase Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="rounded-[18px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-light">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-[18px]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-light">End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-[18px]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < new Date() || 
                            (form.watch("start_date") && date < form.watch("start_date"))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Max Uses (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormDescription className="font-light">
                      Total number of times this coupon can be used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_uses_per_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-light">Max Uses Per User</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormDescription className="font-light">
                      Maximum times a single user can use this coupon
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                className="rounded-[18px] font-light"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-[18px] font-light"
                disabled={createCouponMutation.isPending}
              >
                {createCouponMutation.isPending ? "Creating..." : "Create Coupon"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

