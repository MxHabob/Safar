import Graphic from "@/components/shared/graphic";
import { UserAvatar } from "./user-avatar";
import { LoginButton } from "./login-button";
import { getServerSession } from "@/lib/auth/server/session";

/**
 * Right Side Navbar Component (Server Component)
 * Follows Next.js 16.0.7 best practices:
 * - Server Component for data fetching
 * - Conditionally renders user avatar or login button
 */
export const RightSideNavbar = async () => {
  const session = await getServerSession();

  return (
    <div className="fixed top-3 right-3 z-40 bg-background rounded-bl-[18px] cursor-pointer select-none">
      <div className="relative pb-3 px-4">
        {session ? (
          <UserAvatar user={session} className="cursor-pointer " />
        ) : (
          <LoginButton />
        )}
        <Graphic className="absolute -bottom-4 right-0 rotate-90" />
        <Graphic className="absolute -left-4 top-0 rotate-90" />
      </div>
    </div>
  );
};
