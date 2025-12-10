"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetAvailableModelsApiV1AnalysisModelsGet } from "@/generated/hooks/analysis"
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type ModelLite = { id?: string | number; display_name?: string; name?: string }

export function ModelsPerformanceClient() {
  const { data, isLoading } = useGetAvailableModelsApiV1AnalysisModelsGet()

  const list = Array.isArray(data?.data) ? (data?.data as ModelLite[]) : []

  // Mock performance data - replace with actual API call when available
  const performanceData = list.map((model) => ({
    id: String(model.id ?? model.display_name ?? model.name ?? ""),
    name: model.display_name || model.name || "Unnamed model",
    accuracy: 95.5 + Math.random() * 4,
    latency: 120 + Math.random() * 80,
    throughput: 50 + Math.random() * 30,
    uptime: 99.5 + Math.random() * 0.5,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Model Performance</h2>
        <p className="text-muted-foreground">
          Monitor and analyze model performance metrics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Models</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{list.length}</div>
                <p className="text-xs text-muted-foreground">Active deployments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.length > 0
                    ? (performanceData.reduce((acc, m) => acc + m.accuracy, 0) / performanceData.length).toFixed(1)
                    : "0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Across all models</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.length > 0
                    ? Math.round(performanceData.reduce((acc, m) => acc + m.latency, 0) / performanceData.length)
                    : "0"}
                  ms
                </div>
                <p className="text-xs text-muted-foreground">Response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.length > 0
                    ? (performanceData.reduce((acc, m) => acc + m.uptime, 0) / performanceData.length).toFixed(2)
                    : "0"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">System availability</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>Detailed performance data for each model</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : performanceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceData.map((model) => (
                    <div key={model.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{model.name}</h3>
                        <span className="text-sm text-muted-foreground">ID: {model.id}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                          <p className="text-lg font-semibold">{model.accuracy.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Latency</p>
                          <p className="text-lg font-semibold">{Math.round(model.latency)}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Throughput</p>
                          <p className="text-lg font-semibold">{Math.round(model.throughput)}/min</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Uptime</p>
                          <p className="text-lg font-semibold">{model.uptime.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Advanced analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon. This will include:
                <ul className="mt-4 text-left list-disc list-inside space-y-2">
                  <li>Performance trends over time</li>
                  <li>Model comparison charts</li>
                  <li>Usage statistics</li>
                  <li>Error rate analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

