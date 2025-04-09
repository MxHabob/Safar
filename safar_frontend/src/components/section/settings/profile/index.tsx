"use client"
import Link from "next/link"
import { Calendar, Globe, Mail, MapPin, Phone, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/redux/hooks/useAuth"
import { formatDate } from "@/lib/utils/date-formatter"
import { getInitials } from "@/lib/utils"

export const ProfilePageContent = () => {
  const {user} = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left sidebar with profile info */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.profile?.avatar} alt={`${user?.first_name} ${user?.last_name}`} />
                  <AvatarFallback className="text-2xl">{getInitials(user?.first_name, user?.last_name)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                {user?.first_name} {user?.last_name}
                {user?.is_online && <span className="h-3 w-3 rounded-full bg-emerald-500" title="Online"></span>}
              </CardTitle>
              <CardDescription>@{user?.username}</CardDescription>
              <div className="mt-2 flex justify-center">
                <Badge variant="outline" className="capitalize">
                  {user?.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{user?.profile?.bio || "No bio provided"}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{user?.email}</p>
                  </div>

                  {user?.profile?.phone_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{user?.profile.phone_number}</p>
                    </div>
                  )}

                  {(user?.profile?.city || user?.profile?.country) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">
                        {[user.profile?.city, user?.profile?.region, user.profile?.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}

                  {user?.profile?.date_of_birth && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">Born {formatDate(user?.profile.date_of_birth)}</p>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">Member since {formatDate(user?.created_at)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="font-semibold">{user?.points}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{user?.is_profile_public}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">4</p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        </div>
        </div>
)}