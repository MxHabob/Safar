import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar } from "lucide-react"

interface TravelHistoryProps {
  history: Array<{
    id: string
    name: string
    date: string
  }>
}

export default function TravelHistory({ history }: TravelHistoryProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((trip) => (
              <div key={trip.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="bg-gray-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{trip.name}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(trip.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No travel history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
