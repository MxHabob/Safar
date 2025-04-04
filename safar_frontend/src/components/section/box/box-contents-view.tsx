"use client"

import type { Box } from "@/redux/types/types"

interface BoxContentsViewProps {
  box: Box
  onItemClick: (id: string) => void
  selectedItemId: string | null
}

export default function BoxContentsView({ box, onItemClick, selectedItemId }: BoxContentsViewProps) {

  return (
    <div className="space-y-6">
    </div>
  )
}

