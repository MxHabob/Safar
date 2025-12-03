import {
  SectionCardsLoading,
} from "@/pages/dashboard/section-cards-view";
import {
  ChartAreaLoading,
} from "@/pages/dashboard/chart-area-view";
import { MapView } from "@/pages/dashboard/map-view";

export default function Loading() {
  return (
    <div className="py-4 px-4 md:px-8 flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground ">
          See your photos, travel history, and more.
        </p>
      </div>
      <div className="@container/main flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCardsLoading />
          <ChartAreaLoading />
          <MapView />
        </div>
      </div>
    </div>
  );
}

