import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Settings",
  description: "Account settings",
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-4">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/profile/settings/security">Security</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/profile/settings/devices">Devices</Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/profile/settings/2fa">Two-Factor Authentication</Link>
        </Button>
      </div>
    </div>
  );
}

