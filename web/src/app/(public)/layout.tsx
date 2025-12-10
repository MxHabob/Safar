import { Header } from "@/features/home/components/header";

export default function PublicLayout({ children}: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen p-3">{children}</main>
    </>
  );
}

