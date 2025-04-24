"use client";

import { SearchHeader } from "./search-header";
import { SeasonalInfoCard } from "./seasonalInfo-card";
import { ItineraryRecommendations } from "./itinerary-recommendations";

export default function SearchPageContent() {

  const seasonalData = [
    {
      season: "Spring",
      months: ["March", "April", "May"],
      temperature: "57°F - 75°F",
      rainDays: "6-7 days/month",
      busyness: "Moderately busy",
      notes: ["No bank holidays", "Beautiful spring blooms"]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            {/* <FilterSidebar 
              filters={filters}
              onChange={setFilters}
            /> */}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">When to visit</h3>
              <div className="space-y-4">
                {seasonalData.map((season, i) => (
                  <SeasonalInfoCard key={i} {...season} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:w-3/4">
            {/* <div className="mb-8">
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />
            </div> */}
            
            <ItineraryRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
}