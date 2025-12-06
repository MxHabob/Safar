import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { ProfileView } from '@/components/account/profile-view'

export default async function ProfilePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      <ProfileView user={session.user} />
    </div>
  )
}

