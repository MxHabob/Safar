"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Database, Cpu, HardDrive, Activity } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { formatFileSize } from "@/lib/utils/date"

interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
}

export function SystemClient() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching system health data
    // Replace with actual API call when available
    const fetchHealth = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setHealth({
        status: "healthy",
        uptime: 86400 * 7 + 3600 * 12, // 7 days 12 hours in seconds
        memory: {
          used: 8 * 1024 * 1024 * 1024, // 8 GB
          total: 16 * 1024 * 1024 * 1024, // 16 GB
          percentage: 50,
        },
        cpu: {
          usage: 35,
          cores: 8,
        },
        disk: {
          used: 500 * 1024 * 1024 * 1024, // 500 GB
          total: 1000 * 1024 * 1024 * 1024, // 1 TB
          percentage: 50,
        },
      })
      setIsLoading(false)
    }
    fetchHealth()
  }, [])

  // Use formatFileSize from utils instead of local function

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
        <p className="text-muted-foreground">
          Monitor system resources and health status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <Badge variant={health?.status === "healthy" ? "default" : "destructive"} className="mb-2">
                  {health?.status || "unknown"}
                </Badge>
                <p className="text-xs text-muted-foreground">Overall system health</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{health ? formatUptime(health.uptime) : "0d 0h 0m"}</div>
                <p className="text-xs text-muted-foreground">System uptime</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{health?.cpu.usage || 0}%</div>
                <p className="text-xs text-muted-foreground">{health?.cpu.cores || 0} cores</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{health ? `${health.memory.percentage}%` : "0%"}</div>
                <p className="text-xs text-muted-foreground">
                  {health ? `${formatFileSize(health.memory.used)} / ${formatFileSize(health.memory.total)}` : "0 B / 0 B"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>Detailed resource utilization metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : health ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{health.cpu.usage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${health.cpu.usage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{health.memory.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${health.memory.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(health.memory.used)} of {formatFileSize(health.memory.total)} used
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{health.disk.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${health.disk.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(health.disk.used)} of {formatFileSize(health.disk.total)} used
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No system health data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

