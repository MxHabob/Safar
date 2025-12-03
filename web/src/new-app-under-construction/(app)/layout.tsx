import { AppLayout } from "@/components/layouts/AppLayout";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}

