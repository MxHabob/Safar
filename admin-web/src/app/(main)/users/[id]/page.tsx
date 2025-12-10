import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { getUserApiV1AdminUsersUserIdGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "User Details | Admin",
  description: "View and manage user details",
};

// Dynamic import for better code splitting
const UserDetailPage = dynamic(
  () =>
    import("@/features/admin/users/user-detail").then((mod) => ({
      default: mod.UserDetailPage,
    })),
  {
    loading: () => (
      <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: true,
  }
);

// Cache the data fetching function
const getUserData = cache(async (userId: string) => {
  try {
    return await getUserApiV1AdminUsersUserIdGet({
      path: { user_id: userId },
    });
  } catch {
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch user data on server
  const userData = await getUserData(id);

  if (!userData?.data) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <UserDetailPage initialUserData={userData.data} />
    </Suspense>
  );
}

