import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, DollarSign, Bell, ArrowRight } from "lucide-react"

import { UserHeader } from "@/components/dashboard/user-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { NotificationItem } from "@/components/dashboard/notification-item"
import { BookingItem } from "@/components/dashboard/booking-item"
import { StatusCircle } from "@/components/dashboard/status-circle"
import { MapView } from "@/components/dashboard/map-view"

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <UserHeader name="Obaidullah Al-Qurashi" email="example@gmail.com" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Aesthetic Deposits"
          value="489.57"
          icon={<DollarSign className="h-4 w-4" />}
          chart={
            <div className="flex h-[40px] items-end gap-1">
              <div className="w-2 bg-primary h-[20px]" />
              <div className="w-2 bg-primary h-[30px]" />
              <div className="w-2 bg-primary h-[15px]" />
              <div className="w-2 bg-primary h-[25px]" />
              <div className="w-2 bg-primary h-[18px]" />
            </div>
          }
        />

        <StatCard
          title="Your Bookings"
          value="16"
          icon={<Calendar className="h-4 w-4" />}
          chart={
            <div className="flex h-[40px] items-center gap-1">
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
              <div className="w-[1px] bg-muted-foreground/30 h-full" />
            </div>
          }
        />

        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Payment Received</p>
                <p className="text-xs text-muted-foreground">Transaction #28492</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 row-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Upcoming Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="2 hours ago"
              />
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="3 hours ago"
              />
              <NotificationItem
                icon={<Bell className="h-4 w-4" />}
                title="Booking Update"
                description="Your booking has been created and is pending confirmation."
                time="5 hours ago"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 row-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>square</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center">
            <div className="text-xl font-bold mb-2">Platinum</div>
            <StatusCircle value={287} maxValue={500} />
          </CardContent>
        </Card>

        <Card className="col-span-1 row-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MapView />
          </CardContent>
        </Card>

        <Card className="col-span-1 row-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Upcoming Bookings</span>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <span className="text-xs">View all</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <BookingItem
                title="You have a reservation at the venue name."
                status="Pending"
                actions={
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check in
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check out
                    </Button>
                  </div>
                }
              />
              <BookingItem
                title="You have a reservation at the venue name."
                status="Pending"
                actions={
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check in
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Check out
                    </Button>
                  </div>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
