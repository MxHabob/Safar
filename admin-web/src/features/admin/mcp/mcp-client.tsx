"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Play, Settings, Activity, Zap } from "lucide-react"
import {
  useListMcpConnectionsApiV1McpConnectionsGet,
  useGetAvailableToolsApiV1McpToolsGet,
  useGetMcpStatusApiV1McpStatusGet,
} from "@/generated/hooks/mcp"
import { useModal } from "@/lib/stores/modal-store"

interface MCPConnection {
  id: string
  name: string
  endpoint: string
  status: string
  last_activity: string
  tools: Array<{
    name: string
    description: string
    type: string
  }>
  permissions: string[]
  rate_limits: Record<string, number>
}

interface MCPTool {
  name: string
  description: string
  type: string
  parameters: Record<string, unknown>
  required_permissions: string[]
  rate_limit?: number
}

interface MCPStatus {
  status: string
  connections: {
    total: number
    active: number
  }
  tools: {
    total: number
    available: string[]
  }
  timestamp: string
}

export function MCPClient() {
  const { onOpen } = useModal()
  
  const { data: connectionsData } = useListMcpConnectionsApiV1McpConnectionsGet()
  const { data: toolsData } = useGetAvailableToolsApiV1McpToolsGet()
  const { data: statusData } = useGetMcpStatusApiV1McpStatusGet()

  const connections = (connectionsData?.data as MCPConnection[]) || []
  const tools = (toolsData?.data as MCPTool[]) || []
  const status = statusData?.data as MCPStatus | undefined

  const handleCreateConnection = () => {
    onOpen("mcpCreateConnection", {
      // Mutations will automatically invalidate and refetch queries
      onSuccess: () => {
        // Optional: Additional callback if needed
      },
    })
  }

  const handleDeleteConnection = (connection: MCPConnection) => {
    onOpen("mcpDeleteConnection", {
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
      },
      // Mutations will automatically invalidate and refetch queries
      onSuccess: () => {
        // Optional: Additional callback if needed
      },
    })
  }

  const handleTestConnection = (connection: MCPConnection) => {
    onOpen("mcpTestConnection", {
      connection: {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MCP Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{status?.status || "unknown"}</div>
            <p className="text-xs text-muted-foreground">
              Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.connections?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{status?.connections?.active ?? 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.tools?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{status?.tools?.available?.length ?? 0} ready</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">MCP Connections</h3>
            <Button onClick={handleCreateConnection}>
              <Plus className="h-4 w-4 mr-2" />
              New Connection
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(connections) &&
                  connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">{connection.name}</TableCell>
                      <TableCell className="font-mono text-sm">{connection.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant={connection.status === "active" ? "default" : "secondary"}>
                          {connection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{Array.isArray(connection.tools) ? connection.tools.length : 0}</TableCell>
                      <TableCell>{new Date(connection.last_activity).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(connection)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteConnection(connection)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <h3 className="text-lg font-semibold">Available MCP Tools</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.isArray(tools) &&
              tools.map((tool) => (
                <Card key={tool.name}>
                  <CardHeader>
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {typeof tool.type === "string" ? tool.type : JSON.stringify(tool.type)}
                        </Badge>
                        {tool.rate_limit && <Badge variant="secondary">{tool.rate_limit}/hour</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Permissions:{" "}
                        {Array.isArray(tool.required_permissions) ? tool.required_permissions.join(", ") : "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <h3 className="text-lg font-semibold">Connection Testing</h3>

          <Card>
            <CardHeader>
              <CardTitle>Test MCP Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select a connection to test MCP message sending and tool execution.
              </p>
              <div className="space-y-2">
                {Array.isArray(connections) &&
                  connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{connection.name}</p>
                        <p className="text-sm text-muted-foreground">{connection.endpoint}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTestConnection(connection)}
                      >
                        Test
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
