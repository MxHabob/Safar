import DashboardLayoutWrapper from "@/components/layout/dashboard-layout";

export default async function DashboardLayout({children}: {children: React.ReactNode;}) {
 
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
