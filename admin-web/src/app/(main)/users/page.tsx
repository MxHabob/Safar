import { Suspense } from 'react'
import { Metadata } from "next"
import dynamic from "next/dynamic"
import { listUsersApiV1AdminUsersGet } from "@/generated/actions/admin"
import { Spinner } from '@/components/ui/spinner'

// Dynamic import for better code splitting
const UserPage = dynamic(
  () => import("@/components/pages/ai/pages/admin/users").then(mod => ({ default: mod.UserPage })),
  {
    loading: () => (
      <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: true,
  }
)

export const metadata: Metadata = {
  title: "User Management | Admin",
  description: "Manage platform users",
}

// Cache the data fetching function
const getInitialUsersData = async () => {
  try {
    return await listUsersApiV1AdminUsersGet({
      query: { skip: 0, limit: 10 }
    })
  } catch {
    return null
  }
}

export default async function Page() {
  // Fetch initial data on server for faster initial load
  const initialUsersData = await getInitialUsersData()

  return (
    <Suspense 
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <UserPage initialUsersData={initialUsersData?.data} />
    </Suspense>
  )
}
