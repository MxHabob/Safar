"use client";

import { TravelPlanForm } from "./components/travel-plan-form";
import { TravelPlansList } from "./components/travel-plans-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, List, Plus } from "lucide-react";

export function TripPlannerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI trip planner
        </h1>
        <p className="text-muted-foreground">
          Create custom travel plans with AI. Tell us about your ideal trip!
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create new plan
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            My saved plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <div className="max-w-3xl mx-auto">
            <TravelPlanForm />
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <TravelPlansList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

