import { RouterBack } from "@/components/global/router-back"

export default function BoxesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col gap-6">
        <div>
          <RouterBack />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Boxees</h1>
          <p className="text-muted-foreground max-w-prose">
            Find unique activities and adventures
          </p>
        </div>
      </header>
      <section aria-label="Boxees content">
      </section>
    </div>
  )
}