import { Suspense } from "react";
import { getDevices } from "@/lib/server/queries/devices";
import { DevicesList } from "@/components/profile/DevicesList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Device Management",
  description: "Manage your devices",
};

export default function DevicesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Device Management</h1>
      <Suspense fallback={<PageSkeleton />}>
        <DevicesContent />
      </Suspense>
    </div>
  );
}

async function DevicesContent() {
  const devices = await getDevices();
  return <DevicesList devices={devices} />;
}

