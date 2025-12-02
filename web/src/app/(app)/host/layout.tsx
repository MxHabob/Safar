import { HostLayout } from "@/components/layouts/HostLayout";

export default function HostLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HostLayout>{children}</HostLayout>;
}

