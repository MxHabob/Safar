import { RouterBack } from "@/components/global/router-back"

export default function BoxesPage() {

  return (
   <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <RouterBack/>
      <div className="flex flex-col items-center justify-center my-6">
          <h1 className="text-4xl font-bold">Boxees</h1>
          <p className="text-muted-foreground">
            Find unique activities and adventures
          </p>
      </div>
      </div>
        <div className="relative">

        </div>
      </div>
  )
}