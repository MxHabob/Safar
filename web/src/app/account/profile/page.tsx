import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { getCurrentUserInfoApiV1UsersMeGet } from '@/generated/actions/users'
import { ProfileView } from '@/components/account/profile-view'

export default async function ProfilePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  let userData
  try {
    userData = await getCurrentUserInfoApiV1UsersMeGet()
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    userData = session.user
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      <ProfileView user={userData} />
    </div>
  )
}

