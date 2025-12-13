"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { createAgencyApiV1AgenciesPost } from "@/generated/actions/agencies";
import { ActionError } from "@/generated/lib/safe-action";

const agencyRegistrationSchema = z.object({
  name: z.string().min(3, "Agency name must be at least 3 characters").max(255),
  description: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type AgencyRegistrationFormValues = z.infer<typeof agencyRegistrationSchema>;

export function AgencyRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AgencyRegistrationFormValues>({
    resolver: zodResolver(agencyRegistrationSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      country: "",
    },
  });

  const onSubmit = async (values: AgencyRegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createAgencyApiV1AgenciesPost({
        name: values.name,
        description: values.description,
        email: values.email,
        phone_number: values.phone,
        website: values.website || undefined,
        address: values.address,
        city: values.city,
        country: values.country,
      });

      toast.success("Agency registered successfully!");
      router.push("/agency/dashboard");
    } catch (error) {
      if (error instanceof ActionError && error.code === 'NOT_IMPLEMENTED') {
        toast.info("Agency registration API is not yet available. This feature will be enabled soon.");
        console.log("Agency registration data (API not available):", values);
      } else {
        toast.error("Failed to register agency. Please try again.");
        console.error("Agency registration error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[18px] border">
      <CardHeader>
        <CardTitle>Register Your Agency</CardTitle>
        <CardDescription>
          Fill in your agency information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your Agency Name"
                      className="rounded-[18px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your agency"
                      className="rounded-[18px] min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Tell us about your agency and what makes it special
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="agency@example.com"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+1 (555) 123-4567"
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://your-agency.com"
                      className="rounded-[18px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Street address"
                      className="rounded-[18px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="City"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Country"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-[18px] border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Agency registration API endpoints are not yet available. 
                This form is ready to connect when the backend is implemented.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[18px]"
            >
              {isSubmitting ? "Registering..." : "Register Agency"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

