import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server/session";

/**
 * Agency layout - requires agency role
 * Protects all agency routes
 */
export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/agency/dashboard");
  }

  const isAgency = user.role === "agency" || (user.roles?.includes("agency") ?? false);

  if (!isAgency) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}

