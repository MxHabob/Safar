"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, MapPin, DollarSign, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateTravelPlanApiV1AiTravelPlannerPostMutation } from "@/generated/hooks/aiTravelPlanner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/client";

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const travelPlanSchema = z.object({
  destination: z.string().min(2, "Destination must be at least 2 characters").max(200),
  start_date: z.date({
    message: "Start date is required",
  }),
  end_date: z.date({
    message: "End date is required",
  }),
  budget: z.number().min(1, "Budget must be greater than 0"),
  currency: z.string().default("USD"),
  travelers_count: z.number().int().min(1).default(1),
  travel_style: z.string().optional(),
  natural_language_request: z.string().optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after the start date",
  path: ["end_date"],
});

type TravelPlanFormValues = z.infer<typeof travelPlanSchema>;

const travelStyles = [
  { value: "family", label: "Family" },
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "business", label: "Business" },
  { value: "adventure", label: "Adventure" },
  { value: "luxury", label: "Luxury" },
  { value: "budget", label: "Budget" },
];

const currencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "EGP", label: "Egyptian Pound (EGP)" },
];

export function TravelPlanForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateTravelPlanApiV1AiTravelPlannerPostMutation({
    onSuccess: (data) => {
      toast.success("Travel plan created successfully!");
      router.push(`/trip-planner/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create travel plan");
    },
  });

  const form = useForm<TravelPlanFormValues>({
    resolver: zodResolver(travelPlanSchema) as any,
    defaultValues: {
      destination: "",
      currency: "USD",
      travelers_count: 1,
      travel_style: undefined,
      natural_language_request: "",
    },
  });

  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");

  const onSubmit = async (values: TravelPlanFormValues) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/trip-planner`);
      return;
    }

    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync({
        destination: values.destination,
        start_date: values.start_date.toISOString().split("T")[0],
        end_date: values.end_date.toISOString().split("T")[0],
        budget: values.budget,
        currency: values.currency,
        travelers_count: values.travelers_count,
        travel_style: values.travel_style || undefined,
        natural_language_request: values.natural_language_request || undefined,
      });
    } catch (error) {
      console.error("Travel plan creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Create an AI travel plan
        </CardTitle>
        <CardDescription>
          Fill in the details and we'll generate a personalized travel plan for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Paris, France"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the city or country you want to visit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Select a date</span>
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
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Select a date</span>
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
                            date < new Date() || (startDate && date <= startDate)
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

            {/* Budget and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Travelers and Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="travelers_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Travelers
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="travel_style"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Travel style</FormLabel>
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? undefined : val)
                    }
                    value={field.value ?? undefined}
                  >
                      <FormControl>
                        <SelectTrigger>
                      <SelectValue placeholder="Choose a travel style (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                        {travelStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Natural Language Request */}
            <FormField
              control={form.control}
              name="natural_language_request"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Example: Family trip to Paris for 5 days with a $3000 budget. We want to visit museums and famous landmarks..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a detailed description of your ideal trip. More details lead to better plans.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create travel plan
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

