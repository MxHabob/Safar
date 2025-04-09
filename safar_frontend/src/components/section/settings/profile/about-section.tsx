import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Globe, Users, Briefcase } from "lucide-react"
import type { User, UserProfile } from "@/types/user"

interface AboutSectionProps {
  user: User
  profile: UserProfile
}

export default function AboutSection({ user, profile }: AboutSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">{profile.bio || "No bio available"}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Member since</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Languages</p>
                <p className="font-medium">
                  {Object.entries(profile.language_proficiency)
                    .map(([lang, level]) => `${lang.charAt(0).toUpperCase() + lang.slice(1)}`)
                    .join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Following</p>
                <p className="font-medium">{user.following.length} people</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Membership</p>
                <p className="font-medium capitalize">{user.membership_level}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Travel Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.travel_interests.map((interest, index) => (
              <Badge key={index} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
