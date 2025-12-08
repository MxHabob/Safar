import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { SettingsView } from '@/components/account/settings-view'

export default async function SettingsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <SettingsView />
    </div>
  )
}

