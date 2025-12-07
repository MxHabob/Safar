import Header from "@/features/home/components/header";

/**
 * Home layout component
 * Provides consistent header and main content area for home route group
 * Follows Safar design system with 18px corners and dark-first approach
 */
const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="min-h-screen p-3">{children}</main>
    </>
  );
};

export default HomeLayout;
