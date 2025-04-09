import type { User, UserProfile } from "@/redux/types/types"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

interface ProfilePageProps {
  user: User & { profile: UserProfile }
}

export const ProfilePageContent = ({ user }: ProfilePageProps) => {
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - User info */}
        <div className="flex-1">
          <div className="flex flex-col items-start">
            {/* Profile image with verification badge */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {user.profile?.avatar ? (
                  <Image
                    src={user.profile.avatar || "/placeholder.svg"}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="absolute bottom-0 right-0">
                <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500" />
              </div>
            </div>

            {/* User name and location */}
            <h1 className="text-2xl font-bold mb-1">Angel John</h1>
            <p className="text-gray-700 mb-4">United States - Arizona - Madeley</p>

            {/* Placeholder content bars */}
            <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded mb-4"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>

            {/* About section */}
            <h2 className="text-xl font-bold mt-8 mb-4">About Angel</h2>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Right side - Stats badge */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <div className="bg-black text-white rounded-t-2xl rounded-b-3xl overflow-hidden">
              {/* Badge header */}
              <div className="relative pt-6 px-6 pb-2">
                <div className="absolute top-2 right-4 bg-gray-200 text-black text-xs px-2 py-0.5 rounded-full">
                  Membership
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-4xl font-bold">88</div>
                    <div className="text-xl font-bold">UK</div>
                    <div className="text-2xl font-bold mt-1">4.7</div>
                  </div>
                  <div className="w-16 h-16 bg-gray-500 rounded-full mt-2"></div>
                </div>
              </div>

              {/* User name in badge */}
              <div className="text-center py-4 text-3xl font-bold">ANGEL</div>

              {/* Stats rows */}
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex justify-between text-xs px-4 py-1 border-t border-gray-700">
                  <span>places visited</span>
                  <span>|</span>
                  <span>12</span>
                  <span>experiments</span>
                  <span>|</span>
                  <span>12</span>
                </div>
              ))}

              {/* Badge footer */}
              <div className="text-right pr-4 py-2 text-xs">English</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
