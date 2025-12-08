"use client";

import { useEffect, useState } from "react";
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
import { updateListingApiV1ListingsListingIdPut } from "@/generated/actions/listings";
import { useRouter } from "next/navigation";
import { uploadFileApiV1FilesUploadPost } from "@/generated/actions/files";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListingResponse } from "@/generated/schemas";

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
  { value: "cabin", label: "Cabin" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "castle", label: "Castle" },
  { value: "treehouse", label: "Treehouse" },
  { value: "boat", label: "Boat" },
  { value: "camper", label: "Camper" },
  { value: "experience", label: "Experience" },
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

const updateListingSchema = z.object({
  title: z.string().min(5).max(500).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  listing_type: z
    .enum([
      "apartment",
      "house",
      "villa",
      "cabin",
      "studio",
      "room",
      "condo",
      "townhouse",
      "castle",
      "treehouse",
      "boat",
      "camper",
      "experience",
    ])
    .optional(),
  address_line1: z.string().min(5).optional(),
  address_line2: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().optional(),
  country: z.string().min(2).optional(),
  postal_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().min(1).optional(),
  bedrooms: z.number().int().min(0).optional(),
  beds: z.number().int().min(0).optional(),
  bathrooms: z.number().optional(),
  max_guests: z.number().int().min(1).optional(),
  square_meters: z.number().optional(),
  base_price: z.string().optional(),
  currency: z.string().optional(),
  cleaning_fee: z.string().optional(),
  service_fee: z.string().optional(),
  security_deposit: z.string().optional(),
  booking_type: z.enum(["instant", "request"]).optional(),
  min_stay_nights: z.number().int().optional(),
  max_stay_nights: z.number().int().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
});

type UpdateListingFormData = z.infer<typeof updateListingSchema>;

interface EditListingFormProps {
  listing: ListingResponse;
  onSuccess?: () => void;
}

export function EditListingForm({ listing, onSuccess }: EditListingFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(listing.images?.map((img) => img.url) || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    lat: listing.latitude || 0,
    lng: listing.longitude || 0,
  });

  const form = useForm<UpdateListingFormData>({
    resolver: zodResolver(updateListingSchema),
    defaultValues: {
      title: listing.title,
      summary: listing.summary || "",
      description: listing.description || "",
      listing_type: listing.listing_type,
      address_line1: listing.address_line1,
      address_line2: listing.address_line2 || "",
      city: listing.city,
      state: listing.state || "",
      country: listing.country,
      postal_code: listing.postal_code || "",
      latitude: listing.latitude,
      longitude: listing.longitude,
      capacity: listing.capacity,
      bedrooms: listing.bedrooms,
      beds: listing.beds,
      bathrooms: listing.bathrooms ? parseFloat(listing.bathrooms.toString()) : undefined,
      max_guests: listing.max_guests,
      square_meters: listing.square_meters,
      base_price: listing.base_price?.toString(),
      currency: listing.currency || "USD",
      cleaning_fee: listing.cleaning_fee?.toString(),
      service_fee: listing.service_fee?.toString(),
      security_deposit: listing.security_deposit?.toString(),
      booking_type: listing.booking_type,
      min_stay_nights: listing.min_stay_nights,
      max_stay_nights: listing.max_stay_nights,
      check_in_time: listing.check_in_time || "",
      check_out_time: listing.check_out_time || "",
    },
  });

  const { execute: updateListing, isExecuting } = useAction(updateListingApiV1ListingsListingIdPut, {
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard`);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to update listing");
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileToBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    const newFiles = Array.from(files);
    setNewImages((prev) => [...prev, ...newFiles]);

    setUploading(true);
    try {
      const uploadPromises = newFiles.map(async (file) => {
        const fileAsBase64 = await fileToBase64(file);
        const result = await uploadFileApiV1FilesUploadPost({
          body: { file: fileAsBase64 },
          params: { query: {} },
        });
        return result?.data?.file?.file_url || "";
      });

      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...urls.filter(Boolean)]);
    } catch (error) {
      toast.error("Failed to upload some images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: UpdateListingFormData) => {
    const updateData: any = {};
    
    // Only include changed fields
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof UpdateListingFormData];
      if (value !== undefined && value !== null && value !== "") {
        updateData[key] = value;
      }
    });

    updateListing({
      params: {
        path: {
          listing_id: listing.id!,
        },
      },
      body: {
        ...updateData,
        latitude: currentLocation.lat || updateData.latitude,
        longitude: currentLocation.lng || updateData.longitude,
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
                  <FormLabel>Title</FormLabel>
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
                    <FormLabel>Listing Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                      value={field.value}
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

        {/* Location - Similar to create form */}
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
                  <FormLabel>Address Line 1</FormLabel>
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

            <div className="h-[300px] w-full rounded-[18px] overflow-hidden border">
              <MapboxComponent
                draggableMarker
                  markers={
                    currentLocation.lat && currentLocation.lng
                      ? [
                          {
                            id: "listing",
                            latitude: currentLocation.lat,
                            longitude: currentLocation.lng,
                          },
                        ]
                      : []
                  }
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
          </CardContent>
        </Card>

        {/* Property Details & Pricing - Similar structure to create form */}
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
                htmlFor="image-upload-edit"
                className="cursor-pointer rounded-[18px] border border-dashed p-6 flex-1 text-center hover:bg-accent transition-colors"
              >
                <Upload className="size-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">Add more images</span>
                <input
                  id="image-upload-edit"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  disabled={uploading}
                />
              </Label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((url, index) => (
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
            {isExecuting ? "Updating..." : "Update Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

