import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { AccountOverview } from '@/components/account/account-overview'

export default async function AccountPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {session.user.first_name || session.user.email}
        </p>
      </div>

      <AccountOverview user={session.user} role={session.user.role} />
    </div>
  )
}

