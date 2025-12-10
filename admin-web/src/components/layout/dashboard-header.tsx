"use client";

import { BellIcon, SearchIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notification-center";
import { ModeToggle } from "@/components/mode-toggle";
import { SelectModel } from "@/components/pages/ai/pages/ai-page/components/select-model";
import { PrivacyModeToggle } from "@/components/pages/ai/components/privacy-mode-toggle";

type Model = {
  id: string;
  name?: string;
  display_name: string;
  description: string;
  type?: string;
  version?: string;
  inference_time?: number;
  status?: string;
  is_active?: boolean;
  accuracy?: number;
};

interface DashboardHeaderProps {
  defaultModel?: Model;
}

/**
 * DashboardHeader Component
 *
 * Removed prop drilling - only receives defaultModel for initialization
 * SelectModel now manages its own state via Zustand store
 */
export const DashboardHeader = ({ defaultModel }: DashboardHeaderProps) => {
  const { open } = useSidebar();

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-4 transition-all duration-200"
      role="banner"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <SidebarTrigger
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          aria-controls="main-sidebar"
        />
        <Separator orientation="vertical" className="h-4" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-transparent"
            aria-label="Search"
          >
            <SearchIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </Button>

          <NotificationCenter variant="popover" />

          <ModeToggle />
        </div>
        <SelectModel defaultModel={defaultModel} />
        <PrivacyModeToggle />
      </div>
    </header>
  );
};