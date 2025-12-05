import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { SecurityView } from '@/components/account/security-view'

export default async function SecurityPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and authentication settings
        </p>
      </div>

      <SecurityView />
    </div>
  )
}

