"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
// Date formatting helper
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDateForURL = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

interface HeroSearchProps {
  className?: string;
}

/**
 * Hero search section - Main search bar for destinations, dates, and guests
 * Modern design following travel platform best practices
 */
export const HeroSearch = ({ className }: HeroSearchProps) => {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState(2);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("check_in", formatDateForURL(checkIn));
    if (checkOut) params.set("check_out", formatDateForURL(checkOut));
    if (guests) params.set("guests", guests.toString());
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-background/95 backdrop-blur-sm border rounded-[18px] p-4 lg:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-2">
          {/* Destination Search */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-12 h-14 lg:h-16 text-base rounded-[18px] border-2 focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Check-in Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-14 lg:h-16 px-4 lg:px-6 rounded-[18px] border-2 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 size-5" />
                {checkIn ? formatDate(checkIn) : "Check in"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[18px]" align="start">
              <CalendarComponent
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Check-out Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-14 lg:h-16 px-4 lg:px-6 rounded-[18px] border-2 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 size-5" />
                {checkOut ? formatDate(checkOut) : "Check out"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[18px]" align="start">
              <CalendarComponent
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Guests */}
          <div className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              max="16"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="w-20 h-14 lg:h-16 text-center rounded-[18px] border-2"
            />
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-14 lg:h-16 px-8 rounded-[18px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Search className="mr-2 size-5" />
            <span className="hidden lg:inline">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

