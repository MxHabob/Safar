import { Metadata } from "next";
import { AgencyRegistrationForm } from "@/features/agency/components/agency-registration-form";
import { getCurrentUser } from "@/lib/auth/server/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register Travel Agency",
  description: "Register your travel agency on Safar",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AgencyRegisterPage() {
  const user = await getCurrentUser().catch(() => null);

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/agencies/register");
  }

  // If user already has agency role, redirect to dashboard
  if (user.role === "agency" || user.roles?.includes("agency")) {
    redirect("/agency/dashboard");
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">
            Register Your Travel Agency
          </h1>
          <p className="text-muted-foreground font-light mt-2">
            Join Safar as a travel agency and start managing your listings
          </p>
        </div>

        <AgencyRegistrationForm />
      </div>
    </div>
  );
}

