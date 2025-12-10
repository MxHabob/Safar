import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Authentication - Safar",
  description: "Sign in or create an account to access Safar",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Auth Layout
 * Simple layout for authentication pages without header
 * Redirects to home if user is already authenticated
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect if already authenticated
  const session = await getServerSession().catch(() => null);
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 py-8">
        {children}
      </div>
    </div>
  );
}

