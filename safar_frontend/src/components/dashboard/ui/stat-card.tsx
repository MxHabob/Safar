"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface StatCardProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function StatCard({ title, icon, children }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
          <div className="flex-1">{children}</div>
        </div>
      </CardContent>
    </Card>
  )
}
