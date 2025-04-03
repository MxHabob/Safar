
import { Nav } from "@/components/section/header/nav";

export default function MainLayout({children}:{children: React.ReactNode;}) {
  return (
    <main className="w-full min-h-screen flex flex-col px-8">
      <Nav />
      <div className="mx-24">
      {children}
      </div>
    </main>
  )
}

