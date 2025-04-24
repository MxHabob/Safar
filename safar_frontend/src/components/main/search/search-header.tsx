import { Magnet } from "lucide-react";

export function SearchHeader() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Get a personalized itinerary just for you
        </h1>
        <p className="mt-6 text-xl text-indigo-100 max-w-3xl mx-auto">
          Guided by traveler tips and reviews
        </p>
        <div className="mt-10">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Magnet className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-lg bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm"
              placeholder="Search by city (e.g. Rome, New York)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}