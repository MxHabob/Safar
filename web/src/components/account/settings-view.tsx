'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Bell, Globe, Moon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteAccountApiV1UsersAccountDeletePost } from '@/generated/actions/users'
import { useRouter } from 'next/navigation'

export function SettingsView() {
  const router = useRouter()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: false,
  })

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountApiV1UsersAccountDeletePost({
        password: '', // Will need to prompt for password
        reason: 'User requested account deletion',
      })
      toast.success('Account deleted successfully')
      router.push('/auth/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={notifications.push}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, push: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-notifications">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and updates
              </p>
            </div>
            <Switch
              id="marketing-notifications"
              checked={notifications.marketing}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, marketing: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="ar">
              <SelectTrigger id="language" className="rounded-[18px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select defaultValue="USD">
              <SelectTrigger id="currency" className="rounded-[18px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                <SelectItem value="AED">AED (د.إ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="UTC">
              <SelectTrigger id="timezone" className="rounded-[18px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the appearance of your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select defaultValue="system">
              <SelectTrigger id="theme" className="rounded-[18px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive border-2 rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-[18px]">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[18px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="rounded-[18px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

