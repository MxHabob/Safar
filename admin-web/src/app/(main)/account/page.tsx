import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import { getCurrentUserInfoApiV1UsersMeGet } from "@/generated/actions/users";
import { AccountSettingsPage } from "@/features/account";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Account Settings | Admin",
  description: "Manage your account settings, security, and preferences",
};

// Cache the data fetching function for better performance
const getAccountData = cache(async () => {
  try {
    const user = await getCurrentUserInfoApiV1UsersMeGet();
    return {
      user: user?.data || undefined,
    };
  } catch (error) {
    console.error("Error fetching account data:", error);
    return {
      user: undefined,
    };
  }
});

export default async function AccountPage() {
  // Fetch initial data on server for faster initial load
  const { user } = await getAccountData();

  return (
    <Suspense
      fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AccountSettingsPage initialUser={user} />
    </Suspense>
  );
}

