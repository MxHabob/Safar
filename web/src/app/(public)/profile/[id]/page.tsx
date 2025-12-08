import { Suspense } from "react";
import { Metadata } from "next";
import { UserProfileView, UserProfileLoading } from "@/features/profile/user-profile-view";

type Params = Promise<{ id: string }>;

export const revalidate = 300; // ISR: Revalidate every 5 minutes

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `User Profile - Safar`,
    description: "View user profile",
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * User profile page
 * Shows public user profile information
 */
export default async function UserProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<UserProfileLoading />}>
      <UserProfileView userId={id} />
    </Suspense>
  );
}

