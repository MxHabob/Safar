import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server/session'
import { AccountOverview } from '@/features/account/account-overview'

export default async function AccountPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.first_name || user.email}
        </p>
      </div>

      <AccountOverview user={user} role={user.role} />
    </div>
  )
}

