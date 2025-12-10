"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ActionButton } from "@/components/ui/action-button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useGetAvailableModelsApiV1AnalysisModelsGet } from "@/generated/hooks/analysis"
import { useState } from "react"
import { Upload, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

type ModelLite = { id?: string | number; display_name?: string; name?: string }

export function ModelsDeployClient() {
  const { data, isLoading, refetch } = useGetAvailableModelsApiV1AnalysisModelsGet()
  const [deploying, setDeploying] = useState<string | null>(null)

  const list = Array.isArray(data?.data) ? (data?.data as ModelLite[]) : []

  const handleDeploy = async (modelId: string | number) => {
    setDeploying(String(modelId))
    try {
      // Simulate deployment - replace with actual API call when available
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Model ${modelId} deployment initiated`)
    } catch (error) {
      toast.error(`Failed to deploy model ${modelId}`)
    } finally {
      setDeploying(null)
    }
  }

  const handleReload = async () => {
    try {
      await refetch()
      toast.success("Models reloaded successfully")
    } catch (error) {
      toast.error("Failed to reload models")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deploy Models</h2>
          <p className="text-muted-foreground">
            Manage model deployments and reloads
          </p>
        </div>
        <ActionButton
          onClick={handleReload}
          variant="outline"
          loading={isLoading}
          icon={RefreshCw}
          loadingText="Reloading..."
        >
          Reload All Models
        </ActionButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Select a model to deploy or reload
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No models available
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((model, idx) => {
                const modelId = String(model.id ?? model.display_name ?? model.name ?? idx)
                const isDeploying = deploying === modelId
                return (
                  <div
                    key={modelId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {model.display_name || model.name || "Unnamed model"}
                        </p>
                        <p className="text-sm text-muted-foreground">ID: {modelId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Ready</Badge>
                      <ActionButton
                        size="sm"
                        onClick={() => handleDeploy(modelId)}
                        loading={isDeploying}
                        icon={Upload}
                        loadingText="Deploying..."
                      >
                        Deploy
                      </ActionButton>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Models</span>
              <span className="font-medium">{list.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deployed</span>
              <span className="font-medium">{list.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

