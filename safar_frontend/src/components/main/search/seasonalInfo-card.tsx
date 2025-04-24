import { Info } from "lucide-react";

export function SeasonalInfoCard({ season, months, temperature, rainDays, busyness, notes }: {
  season: string;
  months: string[];
  temperature: string;
  rainDays: string;
  busyness: string;
  notes?: string[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{season}</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {months.join(', ')}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="text-lg font-semibold">{temperature}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rainy days</p>
            <p className="text-lg font-semibold">{rainDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Crowds</p>
            <p className="text-lg font-semibold">{busyness}</p>
          </div>
          {notes && notes.length > 0 && (
            <div className="col-span-2">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  {notes.map((note, i) => (
                    <p key={i} className="text-sm text-gray-600">{note}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}