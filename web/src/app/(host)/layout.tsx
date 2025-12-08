import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-provider";

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
  const session = await getSession().catch(() => null);

  if (!session) {
    redirect("/login");
  }

  // Check if user is a host
  const isHost = session.user.role === "host" || 
                 (session.user as any).is_host || 
                 session.user.role === "admin";

  if (!isHost) {
    redirect("/");
  }

  return <>{children}</>;
}

