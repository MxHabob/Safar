'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateCurrentUserApiV1UsersMePut } from '@/generated/actions/users'
import { Camera, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  username: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone_number: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileViewProps {
  user: any
}

export function ProfileView({ user }: ProfileViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      bio: user.bio || '',
      phone_number: user.phone_number || '',
      country: user.country || '',
      city: user.city || '',
      language: user.language || 'ar',
      locale: user.locale || 'en',
      currency: user.currency || 'USD',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      await updateCurrentUserApiV1UsersMePut(data)
      toast.success('Profile updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 rounded-[18px]">
              <AvatarImage src={user.avatar_url || user.avatar} alt={user.full_name || user.email} />
              <AvatarFallback className="rounded-[18px] text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-[18px]"
                onClick={() => {
                  // TODO: Implement image upload
                  toast.info('Image upload coming soon')
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...form.register('first_name')}
                className="rounded-[18px]"
                placeholder="John"
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...form.register('last_name')}
                className="rounded-[18px]"
                placeholder="Doe"
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...form.register('username')}
              className="rounded-[18px]"
              placeholder="johndoe"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="rounded-[18px] bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              {...form.register('phone_number')}
              className="rounded-[18px]"
              placeholder="+1 234 567 8900"
            />
            {form.formState.errors.phone_number && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone_number.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...form.register('bio')}
              className="rounded-[18px] min-h-[100px]"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground">
              {form.watch('bio')?.length || 0} / 500 characters
            </p>
            {form.formState.errors.bio && (
              <p className="text-sm text-destructive">
                {form.formState.errors.bio.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location & Preferences */}
      <Card className="border rounded-[18px]">
        <CardHeader>
          <CardTitle>Location & Preferences</CardTitle>
          <CardDescription>
            Set your location and language preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...form.register('country')}
                className="rounded-[18px]"
                placeholder="United States"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register('city')}
                className="rounded-[18px]"
                placeholder="New York"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                {...form.register('language')}
                className="rounded-[18px]"
                placeholder="ar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Input
                id="locale"
                {...form.register('locale')}
                className="rounded-[18px]"
                placeholder="en"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                {...form.register('currency')}
                className="rounded-[18px]"
                placeholder="USD"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-[18px]"
          onClick={() => form.reset()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-[18px]"
          disabled={isLoading}
        >
          {isLoading ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

