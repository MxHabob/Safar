import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Host Dashboard - Safar",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Host Layout
 * Requires authentication and host role
 * Redirects to home if user is not a host
 */
export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    redirect("/login");
  }

  // Check if user is a host
  const isHost = user.role === "host" || 
                 (user as any).roles.includes("host") || 
                 user.role === "admin";

  if (!isHost) {
    redirect("/");
  }

  return <>{children}</>;
}

