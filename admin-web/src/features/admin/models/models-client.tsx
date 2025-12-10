"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetAvailableModelsApiV1AnalysisModelsGet } from "@/generated/hooks/analysis"

type ModelLite = { id?: string | number; display_name?: string; name?: string }

interface ModelsClientProps {
  initialModelsData?: unknown
}

export function ModelsClient({ initialModelsData }: ModelsClientProps = {}) {
  // Use initialData from server for faster initial load and better SEO
  // React Query will hydrate with this data and handle subsequent updates
  const { data = [], isLoading, isError } = useGetAvailableModelsApiV1AnalysisModelsGet({
    initialData: initialModelsData,
    // refetchOnWindowFocus: false,
  });
  const payload = data?.data as unknown
  const list = Array.isArray(payload)
    ? (payload as ModelLite[])
    : Array.isArray((payload as { models?: ModelLite[] })?.models)
    ? ((payload as { models?: ModelLite[] }).models ?? [])
    : []
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Versions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="list-disc pl-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-4 w-48 bg-muted rounded" />
            ))}
          </ul>
        ) : isError ? (
          <div className="text-sm text-destructive">Failed to load models.</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-muted-foreground">No models available.</div>
        ) : (
          <ul className="list-disc pl-5">
            {list.map((m, idx) => (
              <li key={String(m.id ?? m.display_name ?? m.name ?? idx)}>
                {m.display_name || m.name || 'Unnamed model'}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}


