import { Suspense } from "react";
import { getCurrentUser } from "@/lib/server/auth";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Profile",
  description: "Your profile",
};

export default async function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Not authenticated</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="space-y-4">
        <div>
          <p className="font-semibold">Name:</p>
          <p>{user.first_name} {user.last_name}</p>
        </div>
        <div>
          <p className="font-semibold">Email:</p>
          <p>{user.email}</p>
        </div>
      </div>
    </div>
  );
}

