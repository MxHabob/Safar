import { Header } from "@/features/home/components/header";

/**
 * Public Layout
 * Provides consistent header and main content area for public pages
 * Follows Safar design system with 18px corners and dark-first approach
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen p-3">{children}</main>
    </>
  );
}

