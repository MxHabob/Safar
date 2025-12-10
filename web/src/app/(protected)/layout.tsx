import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Account",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Protected Layout
 * Requires authentication - redirects to login if not authenticated
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser().catch(() => null);

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
