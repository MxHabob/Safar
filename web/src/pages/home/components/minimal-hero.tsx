"use client";

import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SliderView } from "@/pages/home/slider-view";
import { SliderViewLoadingStatus } from "@/pages/home/slider-view";
import Graphic from "@/components/shared/graphic";

/**
 * Minimal hero section - Editorial style with subtle elegance
 * Uses Safar's unique graphic elements and 18px corners
 */
export const MinimalHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center p-3 lg:p-6">
      {/* Background with graphic corners */}
      <div className="absolute inset-0 rounded-[18px] overflow-hidden bg-muted/30">
        <Suspense fallback={<SliderViewLoadingStatus />}>
          <SliderView />
        </Suspense>
        <div className="absolute inset-0 bg-background/40" />
      </div>

      {/* Graphic corner elements */}
      <div className="absolute top-0 left-0 size-[18px]">
        <Graphic />
      </div>
      <div className="absolute top-0 right-0 size-[18px] rotate-90">
        <Graphic />
      </div>
      <div className="absolute bottom-0 left-0 size-[18px] -rotate-90">
        <Graphic />
      </div>
      <div className="absolute bottom-0 right-0 size-[18px] rotate-180">
        <Graphic />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        <div className="mb-12 space-y-6">
          <h1 className="text-5xl lg:text-7xl font-light tracking-tight leading-none">
            Where will you
            <br />
            <span className="font-normal">go next?</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground font-light max-w-xl mx-auto">
            Discover places that inspire. Stay where stories begin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-[18px] px-8 py-6 text-base group"
          >
            <Link href="/discover">
              Explore Destinations
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-[18px] px-8 py-6 text-base border-2"
          >
            <Link href="/listings">Find Stays</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
