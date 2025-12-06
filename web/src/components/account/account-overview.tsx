import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Calendar, 
  Heart, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AccountOverviewProps {
  user: any
  role: string
}

export function AccountOverview({ user, role }: AccountOverviewProps) {
  const isHost = role === 'host' || role === 'agency'
  const isAdmin = role === 'admin' || role === 'super_admin'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border rounded-[18px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {user.is_email_verified ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">Not Verified</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-[18px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={user.is_active ? "default" : "destructive"}
              className="rounded-[18px]"
            >
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border rounded-[18px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="rounded-[18px] capitalize">
              {role}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border rounded-[18px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-medium">
              {user.created_at 
                ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })
                : 'N/A'}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Bookings
            </CardTitle>
            <CardDescription>
              View and manage your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account/bookings">
              <Button className="w-full rounded-[18px]" variant="outline">
                View Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Wishlist
            </CardTitle>
            <CardDescription>
              Your saved listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account/wishlist">
              <Button className="w-full rounded-[18px]" variant="outline">
                View Wishlist
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/account/security">
              <Button className="w-full rounded-[18px]" variant="outline">
                Security Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {isHost && (
          <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Host Dashboard
              </CardTitle>
              <CardDescription>
                Manage your listings and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/host">
                <Button className="w-full rounded-[18px]" variant="outline">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isHost && (
          <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View your performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/host/analytics">
                <Button className="w-full rounded-[18px]" variant="outline">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border rounded-[18px] hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                System administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button className="w-full rounded-[18px]" variant="outline">
                  Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Complete your profile to get the most out of Safar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Profile Information</span>
              <Badge variant={user.first_name ? "default" : "outline"} className="rounded-[18px]">
                {user.first_name ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Verification</span>
              <Badge variant={user.is_email_verified ? "default" : "outline"} className="rounded-[18px]">
                {user.is_email_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Phone Verification</span>
              <Badge variant={user.is_phone_verified ? "default" : "outline"} className="rounded-[18px]">
                {user.is_phone_verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
          </div>
          <Link href="/account/profile">
            <Button className="mt-4 w-full rounded-[18px]">
              Complete Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

