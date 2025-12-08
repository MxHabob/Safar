import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session-provider'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { MobileAccountNav } from '@/components/account/mobile-account-nav'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <AccountSidebar user={session.user} />
          </aside>

          {/* Mobile Navigation */}
          <div className="md:hidden w-full">
            <MobileAccountNav user={session.user} />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

