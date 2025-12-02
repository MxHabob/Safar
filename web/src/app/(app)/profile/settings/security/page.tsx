import { SecuritySettings } from "@/components/profile/SecuritySettings";

export const metadata = {
  title: "Security Settings",
  description: "Manage your security settings",
};

export default function SecuritySettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Security Settings</h1>
      <SecuritySettings />
    </div>
  );
}

