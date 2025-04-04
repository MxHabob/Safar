import { Nav } from "@/components/section/header/nav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <main className=" min-h-screen flex flex-col mx-6">
        <Nav />
        {children}
      </main>
  );
}
