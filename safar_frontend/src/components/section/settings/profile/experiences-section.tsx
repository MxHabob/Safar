import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, DollarSign } from "lucide-react"
import type { Experience } from "@/types/user"

interface ExperiencesSectionProps {
  userId: string
}

// Mock experiences data
const mockExperiences: Experience[] = [
  {
    id: "1",
    created_at: "2023-02-15T00:00:00Z",
    updated_at: "2023-02-15T00:00:00Z",
    is_deleted: false,
    owner: { id: "1" } as any,
    title: "Mountain Hiking Adventure",
    description: "Experience the thrill of hiking through beautiful mountain trails with breathtaking views.",
    location: "Rocky Mountains, Colorado",
    price_per_person: 89.99,
    currency: "USD",
    duration: 6,
    capacity: 10,
    schedule: [{ date: "2023-06-15", time: "08:00" }],
    media: [
      {
        id: "1",
        url: "/placeholder.svg?height=200&width=300",
        file: "",
        type: "image",
        created_at: "",
        updated_at: "",
        is_deleted: false,
      },
    ],
    rating: 4.8,
    is_available: true,
  },
  {
    id: "2",
    created_at: "2023-03-10T00:00:00Z",
    updated_at: "2023-03-10T00:00:00Z",
    is_deleted: false,
    owner: { id: "1" } as any,
    title: "Local Cuisine Food Tour",
    description: "Taste the authentic local cuisine with a guided tour through the best restaurants in town.",
    location: "Downtown Phoenix, Arizona",
    price_per_person: 65,
    currency: "USD",
    duration: 3,
    capacity: 8,
    schedule: [{ date: "2023-07-20", time: "18:00" }],
    media: [
      {
        id: "2",
        url: "/placeholder.svg?height=200&width=300",
        file: "",
        type: "image",
        created_at: "",
        updated_at: "",
        is_deleted: false,
      },
    ],
    rating: 4.6,
    is_available: true,
  },
]

export default function ExperiencesSection({ userId }: ExperiencesSectionProps) {
  // Filter experiences by user ID in a real application
  const experiences = mockExperiences

  return (
    <Card>
      <CardContent className="p-6">
        {experiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiences.map((experience) => (
              <Card key={experience.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={experience.media[0]?.url || "/placeholder.svg?height=200&width=300"}
                    alt={experience.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg">{experience.title}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{experience.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span>{experience.duration} hours</span>
                    </div>
                    <div className="flex items-center font-medium">
                      <DollarSign className="h-4 w-4 text-gray-700" />
                      <span>
                        {experience.price_per_person} {experience.currency}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No experiences available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
