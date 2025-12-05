'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  changePasswordApiV1UsersPasswordChangePost,
  get2faStatusApiV1Users2faStatusGet,
  setup2faApiV1Users2faSetupPost,
  disable2faApiV1Users2faDisablePost,
  listDevicesApiV1UsersUsersDevicesGet,
  removeDeviceApiV1UsersUsersDevicesDeviceIdDelete
} from '@/generated/actions/users'
import { Shield, Key, Smartphone, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
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

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export function SecurityView() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch 2FA status
  const { data: twoFactorStatus, isLoading: isLoading2FA } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      try {
        return await get2faStatusApiV1Users2faStatusGet()
      } catch (error) {
        return null
      }
    },
  })

  // Fetch devices
  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      try {
        return await listDevicesApiV1UsersUsersDevicesGet()
      } catch (error) {
        return []
      }
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      await changePasswordApiV1UsersPasswordChangePost({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully')
      passwordForm.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    try {
      const result = await setup2faApiV1Users2faSetupPost()
      // Redirect to 2FA setup page with QR code
      window.location.href = `/account/security/2fa/setup?secret=${result.secret}&qr_code=${result.qr_code}`
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup 2FA')
    }
  }

  const handleDisable2FA = async () => {
    try {
      await disable2faApiV1Users2faDisablePost({
        password: '', // Will need to prompt for password
      })
      toast.success('2FA disabled successfully')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable 2FA')
    }
  }

  const removeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await removeDeviceApiV1UsersUsersDevicesDeviceIdDelete({
        path: { device_id: deviceId }
      })
    },
    onSuccess: () => {
      toast.success('Device removed successfully')
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove device')
    },
  })

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                {...passwordForm.register('current_password')}
                className="rounded-[18px]"
              />
              {passwordForm.formState.errors.current_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                {...passwordForm.register('new_password')}
                className="rounded-[18px]"
              />
              {passwordForm.formState.errors.new_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                {...passwordForm.register('confirm_password')}
                className="rounded-[18px]"
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="rounded-[18px]"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading2FA ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : twoFactorStatus?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">2FA is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="rounded-[18px]">
                  Active
                </Badge>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-[18px]">
                    Disable 2FA
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[18px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the extra security layer from your account. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisable2FA}
                      className="rounded-[18px]"
                    >
                      Disable
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">2FA is disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Enable two-factor authentication for better security
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-[18px]">
                  Inactive
                </Badge>
              </div>
              <Link href="/account/security/2fa">
                <Button className="rounded-[18px]">
                  Setup 2FA
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Trusted Devices
          </CardTitle>
          <CardDescription>
            Manage devices that have access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDevices ? (
            <p className="text-sm text-muted-foreground">Loading devices...</p>
          ) : devices && devices.length > 0 ? (
            <div className="space-y-3">
              {devices.map((device: any) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-[18px]"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{device.device_name || 'Unknown Device'}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.user_agent || 'Unknown browser'}
                      </p>
                      {device.last_seen && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last seen: {new Date(device.last_seen).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-[18px] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[18px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Device?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This device will need to be re-authenticated to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeDeviceMutation.mutate(device.id)}
                          className="rounded-[18px]"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trusted devices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

