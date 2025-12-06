"use client";

import { Globe, Heart, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Graphic from "@/components/shared/graphic";

/**
 * About view - Company mission and values
 * Beautiful, editorial-style layout
 */
export const AboutView = () => {
  const values = [
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connecting travelers with unique experiences worldwide",
    },
    {
      icon: Heart,
      title: "Authentic Experiences",
      description: "Curated stays and guides that reflect local culture",
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description: "Leveraging technology to make travel seamless and intelligent",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a network of travelers, hosts, and explorers",
    },
  ];

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="space-y-8 text-center max-w-3xl mx-auto">
        <div className="flex items-baseline justify-center gap-4">
          <h1 className="text-5xl lg:text-6xl font-light tracking-tight">
            About Safar
          </h1>
        </div>
        <p className="text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed">
          The smartest, most distinctive, and seamless travel platform in the world.
          We're reimagining how people discover, book, and experience travel.
        </p>
      </section>

      {/* Mission */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-4">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
            Our Mission
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Card className="rounded-[18px] border border-border">
          <div className="absolute top-0 left-0 size-[18px]">
            <Graphic />
          </div>
          <CardContent className="p-8 lg:p-12">
            <p className="text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-3xl">
              Safar exists to make travel more accessible, authentic, and meaningful. 
              We believe every journey should be an opportunity to connect with new places, 
              cultures, and people. Through intelligent technology and thoughtful design, 
              we're creating a platform that empowers travelers to discover their next adventure 
              while supporting local communities and sustainable tourism.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Values */}
      <section className="space-y-12">
        <div className="flex items-baseline gap-4">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
            Our Values
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card key={index} className="rounded-[18px] border border-border">
                <div className="absolute top-0 right-0 size-[18px] rotate-90">
                  <Graphic />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-light">{value.title}</h3>
                  <p className="text-muted-foreground font-light">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Story */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-4">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
            Our Story
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Card className="rounded-[18px] border border-border">
          <div className="absolute top-0 left-0 size-[18px]">
            <Graphic />
          </div>
          <CardContent className="p-8 lg:p-12 space-y-6">
            <p className="text-muted-foreground font-light leading-relaxed">
              Founded in 2026, Safar emerged from a simple observation: travel should be 
              effortless, inspiring, and transformative. We've built a platform that combines 
              cutting-edge technology with human-centered design to create experiences that 
              feel both intelligent and intuitive.
            </p>
            <p className="text-muted-foreground font-light leading-relaxed">
              Today, Safar connects millions of travelers with unique accommodations, 
              curated travel guides, and authentic experiences across 190+ countries. 
              We're committed to making travel more sustainable, accessible, and meaningful 
              for everyone.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

