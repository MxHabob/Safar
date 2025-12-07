"use client";

import { useState } from "react";
import { useQueryStates } from "nuqs";
import { parseAsInteger, parseAsFloat, parseAsString, parseAsStringEnum } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X, MapPin } from "lucide-react";
import { ListingType } from "@/generated/schemas";

interface AdvancedSearchFiltersProps {
  onFiltersChange?: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query?: string;
  city?: string;
  country?: string;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  min_guests?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort_by?: string;
}

export function AdvancedSearchFilters({ onFiltersChange }: AdvancedSearchFiltersProps) {
  const [params, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    city: parseAsString.withDefault(""),
    country: parseAsString.withDefault(""),
    listing_type: parseAsStringEnum<ListingType>(Object.values(ListingType)),
    minPrice: parseAsInteger,
    maxPrice: parseAsInteger,
    guests: parseAsInteger,
    bedrooms: parseAsInteger,
    bathrooms: parseAsInteger,
    lat: parseAsFloat,
    lng: parseAsFloat,
    radius: parseAsFloat,
    sortBy: parseAsString.withDefault("relevance"),
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof typeof params, value: any) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onFiltersChange?.({
      query: newParams.query || undefined,
      city: newParams.city || undefined,
      country: newParams.country || undefined,
      listing_type: newParams.listing_type || undefined,
      min_price: newParams.minPrice || undefined,
      max_price: newParams.maxPrice || undefined,
      min_guests: newParams.guests || undefined,
      min_bedrooms: newParams.bedrooms || undefined,
      min_bathrooms: newParams.bathrooms || undefined,
      latitude: newParams.lat || undefined,
      longitude: newParams.lng || undefined,
      radius_km: newParams.radius || undefined,
      sort_by: newParams.sortBy || undefined,
    });
  };

  const clearFilters = () => {
    setParams({
      query: "",
      city: "",
      country: "",
      listing_type: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      guests: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      lat: undefined,
      lng: undefined,
      radius: undefined,
      sortBy: "relevance",
    });
  };

  const hasActiveFilters = 
    params.city || 
    params.country || 
    params.listing_type || 
    params.minPrice || 
    params.maxPrice || 
    params.guests || 
    params.bedrooms || 
    params.bathrooms;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by city, country, or property name..."
            value={params.query}
            onChange={(e) => handleFilterChange("query", e.target.value)}
            className="pl-10 rounded-[18px]"
          />
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-[18px]">
              <Filter className="size-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 size-2 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
              <SheetDescription>
                Refine your search to find the perfect accommodation
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="City"
                  value={params.city || ""}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                />
                <Input
                  placeholder="Country"
                  value={params.country || ""}
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                />
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={params.listing_type || ""}
                  onValueChange={(value) => handleFilterChange("listing_type", value as ListingType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {Object.values(ListingType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label>Price Range</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={params.minPrice || ""}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={params.maxPrice || ""}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  {params.minPrice && params.maxPrice && (
                    <Slider
                      value={[params.minPrice, params.maxPrice]}
                      onValueChange={([min, max]) => {
                        handleFilterChange("minPrice", min);
                        handleFilterChange("maxPrice", max);
                      }}
                      min={0}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Guests */}
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input
                  type="number"
                  placeholder="Minimum guests"
                  value={params.guests || ""}
                  onChange={(e) => handleFilterChange("guests", e.target.value ? parseInt(e.target.value) : undefined)}
                  min={1}
                />
              </div>

              {/* Bedrooms */}
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  placeholder="Minimum bedrooms"
                  value={params.bedrooms || ""}
                  onChange={(e) => handleFilterChange("bedrooms", e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                />
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  placeholder="Minimum bathrooms"
                  value={params.bathrooms || ""}
                  onChange={(e) => handleFilterChange("bathrooms", e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                />
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={params.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="size-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {params.city && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleFilterChange("city", "")}
              className="rounded-full"
            >
              City: {params.city}
              <X className="size-3 ml-1" />
            </Button>
          )}
          {params.country && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleFilterChange("country", "")}
              className="rounded-full"
            >
              Country: {params.country}
              <X className="size-3 ml-1" />
            </Button>
          )}
          {params.listing_type && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleFilterChange("listing_type", undefined)}
              className="rounded-full"
            >
              Type: {params.listing_type.replace(/_/g, " ")}
              <X className="size-3 ml-1" />
            </Button>
          )}
          {(params.minPrice || params.maxPrice) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                handleFilterChange("minPrice", undefined);
                handleFilterChange("maxPrice", undefined);
              }}
              className="rounded-full"
            >
              Price: ${params.minPrice || 0} - ${params.maxPrice || "∞"}
              <X className="size-3 ml-1" />
            </Button>
          )}
          {params.guests && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleFilterChange("guests", undefined)}
              className="rounded-full"
            >
              Guests: {params.guests}+
              <X className="size-3 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

