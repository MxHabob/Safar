"use client"

import { useEffect, useRef } from "react"

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const parent = canvas.parentElement
      if (!parent) return

      canvas.width = parent.clientWidth
      canvas.height = 300
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Draw map
    ctx.fillStyle = "#f8f9fa"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "#e9ecef"
    ctx.lineWidth = 0.5

    // Draw random streets
    const drawStreets = () => {
      ctx.beginPath()

      // Horizontal streets
      for (let i = 0; i < 10; i++) {
        const y = Math.random() * canvas.height
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
      }

      // Vertical streets
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
      }

      // Diagonal streets
      for (let i = 0; i < 5; i++) {
        const x1 = Math.random() * canvas.width
        const y1 = Math.random() * canvas.height
        const x2 = Math.random() * canvas.width
        const y2 = Math.random() * canvas.height
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }

      ctx.stroke()
    }

    drawStreets()

    // Draw current location
    const drawCurrentLocation = () => {
      const x = canvas.width / 2
      const y = canvas.height / 2

      // Draw outer circle
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(124, 58, 237, 0.1)"
      ctx.fill()

      // Draw middle circle
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(124, 58, 237, 0.2)"
      ctx.fill()

      // Draw inner circle
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = "rgb(124, 58, 237)"
      ctx.fill()
    }

    drawCurrentLocation()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return (
    <div className="relative h-full w-full min-h-[300px]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
