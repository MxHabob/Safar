"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Upload, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { createListingApiV1ListingsPost } from "@/generated/actions/listings";
import { useRouter } from "next/navigation";
import { uploadFileApiV1FilesUploadPost } from "@/generated/actions/files";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapboxComponent = dynamic(
  () => import("@/components/shared/map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-[18px] border flex items-center justify-center bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

const listingTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "hotel", label: "Hotel" },
  { value: "hostel", label: "Hostel" },
  { value: "resort", label: "Resort" },
  { value: "cabin", label: "Cabin" },
  { value: "cottage", label: "Cottage" },
  { value: "loft", label: "Loft" },
  { value: "studio", label: "Studio" },
];

const bookingTypes = [
  { value: "instant", label: "Instant Booking" },
  { value: "request", label: "Request to Book" },
];

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "AED", label: "AED - UAE Dirham" },
];

const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(500),
  summary: z.string().optional(),
  description: z.string().optional(),
  listing_type: z.enum(["apartment", "house", "villa", "hotel", "hostel", "resort", "cabin", "cottage", "loft", "studio"]),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  postal_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().min(1).optional(),
  bedrooms: z.number().int().min(0).optional(),
  beds: z.number().int().min(0).optional(),
  bathrooms: z.number().optional(),
  max_guests: z.number().int().min(1).optional(),
  square_meters: z.number().optional(),
  base_price: z.number().min(0, "Price must be positive"),
  currency: z.string().optional(),
  cleaning_fee: z.number().optional(),
  service_fee: z.number().optional(),
  security_deposit: z.number().optional(),
  booking_type: z.enum(["instant", "request"]).optional(),
  min_stay_nights: z.number().int().optional(),
  max_stay_nights: z.number().int().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
});

type CreateListingFormData = z.infer<typeof createListingSchema>;

interface CreateListingFormProps {
  onSuccess?: (listingId: string) => void;
}

export function CreateListingForm({ onSuccess }: CreateListingFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      listing_type: "apartment",
      currency: "USD",
      booking_type: "request",
    },
  });

  const { execute: createListing, isExecuting } = useAction(createListingApiV1ListingsPost, {
    onSuccess: (data) => {
      toast.success("Listing created successfully!");
      if (onSuccess) {
        onSuccess(data.id || "");
      } else {
        router.push(`/dashboard`);
      }
    },
    onError: ({ error }) => {
      toast.error(error.message || "Failed to create listing");
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setImages((prev) => [...prev, ...newFiles]);

    // Upload images
    setUploading(true);
    try {
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadFileApiV1FilesUploadPost({ body: formData });
        return result?.data?.url || "";
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls((prev) => [...prev, ...urls.filter(Boolean)]);
    } catch (error) {
      toast.error("Failed to upload some images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreateListingFormData) => {
    createListing({
      body: {
        ...data,
        base_price: data.base_price.toString(),
        latitude: currentLocation.lat || data.latitude,
        longitude: currentLocation.lng || data.longitude,
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle className="text-2xl font-light">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Beautiful apartment in downtown"
                      className="rounded-[18px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief summary of your listing"
                      rows={3}
                      className="rounded-[18px] resize-none"
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
                      placeholder="Detailed description of your listing"
                      rows={6}
                      className="rounded-[18px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="listing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-[18px]">
                          <SelectValue placeholder="Select listing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {listingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="booking_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-[18px]">
                          <SelectValue placeholder="Select booking type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bookingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle className="text-2xl font-light flex items-center gap-2">
              <MapPin className="size-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
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

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Apartment, suite, etc."
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
                    <FormLabel>City *</FormLabel>
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="State or province"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
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

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Postal code"
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Map */}
            <div className="space-y-2">
              <Label>Map Location</Label>
              <div className="h-[300px] w-full rounded-[18px] overflow-hidden border">
                <MapboxComponent
                  draggableMarker
                  markers={currentLocation.lat && currentLocation.lng ? [
                    { id: "listing", lat: currentLocation.lat, lng: currentLocation.lng }
                  ] : []}
                  onMarkerDragEnd={(markerId, lngLat) => {
                    setCurrentLocation({ lat: lngLat.lat, lng: lngLat.lng });
                    form.setValue("latitude", lngLat.lat);
                    form.setValue("longitude", lngLat.lng);
                  }}
                  initialViewState={{
                    longitude: currentLocation.lng || 0,
                    latitude: currentLocation.lat || 0,
                    zoom: 14,
                  }}
                />
              </div>
              <FormDescription>
                Drag the marker to set the exact location
              </FormDescription>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle className="text-2xl font-light">Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beds</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.5"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Guests</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="square_meters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Square Meters</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle className="text-2xl font-light">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price per Night *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-[18px]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="cleaning_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleaning Fee</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Fee</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="min_stay_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stay (Nights)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_stay_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Stay (Nights)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        className="rounded-[18px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="rounded-[18px] border">
          <CardHeader>
            <CardTitle className="text-2xl font-light flex items-center gap-2">
              <Upload className="size-5" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="image-upload"
                className="cursor-pointer rounded-[18px] border border-dashed p-6 flex-1 text-center hover:bg-accent transition-colors"
              >
                <Upload className="size-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload images</span>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  disabled={uploading}
                />
              </Label>
            </div>

            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading images...</p>
            )}

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Listing image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-[18px]"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-[18px]"
                      onClick={() => removeImage(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-[18px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isExecuting || uploading}
            className="rounded-[18px]"
          >
            <Save className="size-4" />
            {isExecuting ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

