import { ProfileView } from '@/features/account/profile-view'
import { getCurrentUser } from '@/lib/auth/server/session'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      <ProfileView user={user} />
    </div>
  )
}

