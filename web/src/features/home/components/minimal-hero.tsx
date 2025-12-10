"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSliderLoading } from "@/features/home/hero-slider";
import Graphic from "@/components/shared/graphic";
import { ListingListResponse } from "@/generated/schemas";

const HeroSlider = dynamic(
  () =>
    import("@/features/home/hero-slider").then((mod) => mod.HeroSlider),
  {
    ssr: false,
    loading: () => <HeroSliderLoading />,
  }
);

export const MinimalHero = ( {initialsData }: { initialsData?: ListingListResponse } ) => {

  return (
    <section className="relative min-h-screen flex items-center justify-center p-3 lg:p-6">
      <div className="absolute inset-0 rounded-[18px] overflow-hidden bg-muted/30">
        <HeroSlider initialsData={initialsData} />
        <div className="absolute inset-0 bg-background/40" />
      </div>
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

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        <div className="mb-12 space-y-6">
          <h1 className="text-5xl lg:text-7xl font-light tracking-tight leading-none">
            Where will you
            <br />
            <span className="font-normal">go next?</span>
          </h1>
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
        </div>
      </div>
    </section>
  );
};
