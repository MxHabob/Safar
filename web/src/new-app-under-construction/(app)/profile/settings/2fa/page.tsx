import { TwoFactorSettings } from "@/components/profile/TwoFactorSettings";

export const metadata = {
  title: "Two-Factor Authentication",
  description: "Manage 2FA settings",
};

export default function TwoFactorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Two-Factor Authentication</h1>
      <TwoFactorSettings />
    </div>
  );
}

