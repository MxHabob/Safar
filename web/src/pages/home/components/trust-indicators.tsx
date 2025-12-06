"use client";

import { Shield, Award, Users, Globe } from "lucide-react";

/**
 * Trust indicators section - Builds credibility and trust
 * Shows key platform benefits and statistics
 */
export const TrustIndicators = () => {
  const indicators = [
    {
      icon: Shield,
      title: "Secure Booking",
      description: "Your payments are protected",
    },
    {
      icon: Award,
      title: "Verified Hosts",
      description: "All hosts are verified",
    },
    {
      icon: Users,
      title: "2M+ Travelers",
      description: "Join millions of happy travelers",
    },
    {
      icon: Globe,
      title: "190+ Countries",
      description: "Explore destinations worldwide",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 py-8 lg:py-12">
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-[18px] bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="mb-3 p-3 rounded-full bg-primary/10">
              <Icon className="size-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm lg:text-base mb-1">
              {indicator.title}
            </h3>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {indicator.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

