import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { getCurrentUserInfoApiV1UsersMeGet } from '@/generated/actions/users'
import { AccountOverview } from '@/components/account/account-overview'

export default async function AccountPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Fetch fresh user data
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
        <h1 className="text-3xl font-bold text-foreground">Account Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {userData.first_name || userData.email}
        </p>
      </div>

      <AccountOverview user={userData} role={session.user.role} />
    </div>
  )
}

