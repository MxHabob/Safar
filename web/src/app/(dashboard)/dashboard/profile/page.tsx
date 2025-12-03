import { getServerSession } from "@/lib/auth/server";
import SecurityAccessCard from "@/pages/auth/components/security-access-card";

export const metadata = {
  title: "Security & Access",
};  

const ProfilePage = async () => {
  const session = await getServerSession();

  return (
    <div className="py-4 px-4 md:px-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Profile & Security</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, password, and active sessions
        </p>
      </div>

      {/* Active Sessions */}
      <div className="lg:col-span-2">
        <SecurityAccessCard
          session={JSON.parse(JSON.stringify(session?.accessToken))}
          activeSessions={JSON.parse(JSON.stringify(session?.accessToken))}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
