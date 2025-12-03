import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata = {
  title: "Edit Profile",
  description: "Edit your profile",
};

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Not authenticated</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <EditProfileForm user={user} />
    </div>
  );
}

