import { Nav } from "@/components/layout/header/nav";

export default function MainLayout({children,}: Readonly<{ children: React.ReactNode}>) {
  return (
    <div>
        <Nav />
        {children}
    </div>
  );
}
