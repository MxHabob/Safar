"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/core/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
