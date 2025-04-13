"use client"

import { useEffect, createContext, useContext, type ReactNode } from "react"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/redux/hooks/use-auth"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  socialLogin: (provider: string, code: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  publicRoutes?: string[]
}

export function AuthProvider({
  children,
  publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"],
}: AuthProviderProps) {
  const auth = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Check authentication status on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.isInitialized) return

      const { isAuthenticated } = await auth.checkAuthStatus()

      // If not authenticated and not on a public route, redirect to login
      if (!isAuthenticated && !publicRoutes.some((route) => pathname.startsWith(route))) {
        router.push("/login")
      }

      // If authenticated and on a login/register page, redirect to home
      if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
        router.push("/")
      }
    }

    checkAuth()
  }, [auth, pathname, router, publicRoutes])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
