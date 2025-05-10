import { RouterBack } from "@/components/global/router-back";
import { ListCountries } from "@/components/main/geographic/country/countries-list/country-list";

export default async function RegionsPage() {

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex flex-col gap-6">
        <div>
          <RouterBack />
        </div>
        
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Regions</h1>
          <p className="text-muted-foreground max-w-prose">
            Discover amazing locations around you
          </p>
        </div>
      </header>
      <section aria-label="Search places" className="flex justify-center">
      </section>
      <section aria-label="Places list">
        <ListCountries />
      </section>
    </div>
  )
}
