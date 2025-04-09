import { ProfilePageContent } from "@/components/section/settings/profile";

const mockUser = {
  id: "1",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  is_deleted: false,
  email: "angel.john@example.com",
  first_name: "Angel",
  last_name: "John",
  language: "en",
  timezone: "America/Phoenix",
  preferred_language: "en",
  preferred_currency: "USD",
  is_online: true,
  is_active: true,
  is_staff: false,
  is_2fa_enabled: false,
  role: "guest" as const,
  is_profile_public: true,
  following: [],
  points: 88,
  membership_level: "gold" as const,
  profile: {
    id: "1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    is_deleted: false,
    user: "1",
    avatar: "/placeholder.svg?height=96&width=96",
    bio: "Travel enthusiast and explorer",
    gender: "prefer_not_to_say" as const,
    travel_history: [],
    travel_interests: [],
    language_proficiency: {},
    preferred_countries: [],
    privacy_consent: true,
    wants_push_notifications: true,
    wants_sms_notifications: false,
  },
}

  export default async function ProfilePage() {
    return (
      <main className="min-h-screen">
      <ProfilePageContent user={mockUser} />
    </main>
  );
}
 
